from datasets import load_dataset, concatenate_datasets, Dataset
from transformers import AutoTokenizer
import os
from utils import label_list, label2id

def load_and_mix_datasets():
    math_qa = load_dataset('allenai/math_qa')['train']
    med_qa = load_dataset(
        'bigbio/med_qa',
        'med_qa_en_4options_source',
        trust_remote_code=True
    )['train']

    def standardize_math_qa(example):
        return {
            'text': example['Problem'] + ' ' + example['options'],
            'question': example['Problem'],
            'options': example['options'].split(' , ')
        }

    def standardize_med_qa(example):
        options = [f"{chr(97+i)}) {opt}" for i, opt in enumerate(example['options'])]
        return {
            'text': example['question'] + ' ' + ' , '.join(options),
            'question': example['question'],
            'options': options
        }

    math_qa = math_qa.map(standardize_math_qa)
    med_qa = med_qa.map(standardize_med_qa)
    mixed_dataset = concatenate_datasets([math_qa, med_qa])
    return mixed_dataset

def preprocess(example, tokenizer):
    full_text = example['text']
    tokenized = tokenizer(full_text, truncation=True, max_length=512, return_offsets_mapping=True)
    if 'offset_mapping' not in tokenized:
        raise ValueError("Tokenizer did not return offset_mapping. Ensure a fast tokenizer is used.")
    labels = [0] * len(tokenized['input_ids'])

    # Tag QUESTION
    question_start = 0
    question_end = len(example['question'])
    for i, offset in enumerate(tokenized.offset_mapping):
        if offset and offset[0] >= question_start and offset[1] <= question_end:
            labels[i] = label2id['B-QUESTION'] if offset[0] == question_start else label2id['I-QUESTION']

    # Tag OPTIONS
    current_pos = len(example['question']) + 1  # Assuming space after question
    for idx, opt in enumerate(example['options']):
        if idx >= 5:
            print(f"Warning: Example has more than 5 options, truncating: {example['text'][:50]}...")
            break
        opt_start = full_text.find(opt, current_pos)
        if opt_start == -1:
            continue
        opt_end = opt_start + len(opt)
        b_label = f'B-OPTION_{chr(65+idx)}'
        i_label = f'I-OPTION_{chr(65+idx)}'
        for i, offset in enumerate(tokenized.offset_mapping):
            if offset and offset[0] >= opt_start and offset[1] <= opt_end:
                labels[i] = label2id[b_label] if offset[0] == opt_start else label2id[i_label]
        current_pos = opt_end + 3  # Assuming ' , ' separator

    if len(tokenized['input_ids']) > 512:
        print(f"Warning: Tokenized sequence exceeds max_length for text: {full_text[:50]}...")
    tokenized['labels'] = labels
    return tokenized

def get_tokenized_datasets(config, tokenizer):
    if not config['data']['use_custom_dataset']:
        dataset = load_and_mix_datasets()
        tokenized_dataset = dataset.map(lambda x: preprocess(x, tokenizer), num_proc=4)
    else:
        custom_file = os.path.join(config['data']['input_dir'], config['data']['custom_dataset_file'])
        if not os.path.exists(custom_file):
            raise FileNotFoundError(f"Custom dataset file not found: {custom_file}")

        def load_conll(file_path):
            sentences = []
            labels = []
            with open(file_path, 'r', encoding='utf-8') as f:
                sentence = []
                label = []
                for line in f:
                    line = line.strip()
                    if not line:
                        if sentence:
                            sentences.append(sentence)
                            labels.append(label)
                        sentence = []
                        label = []
                    else:
                        parts = line.split()
                        if len(parts) != 2:
                            continue
                        word, tag = parts
                        if tag not in label2id:
                            raise ValueError(f"Unknown label in CoNLL file: {tag}")
                        sentence.append(word)
                        label.append(label2id[tag])
                if sentence:
                    sentences.append(sentence)
                    labels.append(label)
            return {'tokens': sentences, 'ner_tags': labels}

        custom_data = load_conll(custom_file)
        custom_dataset = Dataset.from_dict(custom_data)

        def align_labels(examples):
            tokenized_inputs = tokenizer(examples['tokens'], truncation=True, is_split_into_words=True, max_length=512)
            labels = []
            for i, label in enumerate(examples['ner_tags']):
                word_ids = tokenized_inputs.word_ids(batch_index=i)
                previous_word_idx = None
                label_ids = []
                for word_idx in word_ids:
                    if word_idx is None:
                        label_ids.append(-100)
                    elif word_idx != previous_word_idx:
                        label_ids.append(label[word_idx])
                    else:
                        label_ids.append(-100)
                    previous_word_idx = word_idx
                labels.append(label_ids)
            tokenized_inputs['labels'] = labels
            return tokenized_inputs

        tokenized_dataset = custom_dataset.map(align_labels, batched=True)

    # Split into train and eval
    tokenized_datasets = tokenized_dataset.train_test_split(test_size=0.2)
    return tokenized_datasets['train'], tokenized_datasets['test']