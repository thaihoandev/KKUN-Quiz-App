from transformers import pipeline, AutoTokenizer
from utils import label_list  # Not strictly needed but for consistency

def extract_mcq_from_text(text, model_path):
    try:
        tokenizer = AutoTokenizer.from_pretrained(model_path)
        ner_pipeline = pipeline('ner', model=model_path, tokenizer=tokenizer, aggregation_strategy='simple')
    except Exception as e:
        raise RuntimeError(f"Failed to load model or tokenizer from {model_path}: {str(e)}")
    results = ner_pipeline(text)
    mcq = {'question': '', 'options': {chr(65+i): '' for i in range(5)}}
    for res in results:
        entity = res['entity_group']
        if entity.startswith('QUESTION'):
            mcq['question'] += res['word'] + ' '
        elif entity.startswith('OPTION_'):
            opt_key = entity.split('_')[1]
            if opt_key in mcq['options']:
                mcq['options'][opt_key] += res['word'] + ' '
    mcq['question'] = mcq['question'].strip()
    for key in mcq['options']:
        mcq['options'][key] = mcq['options'][key].strip()
    return mcq