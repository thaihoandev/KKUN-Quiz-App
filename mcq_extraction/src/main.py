import yaml
from extract_text import extract_text_from_file
from preprocess import preprocess, label_list, load_and_mix_datasets
from train import train_model
from predict import extract_mcq_from_text
from datasets import load_dataset

def load_config(config_path='config.yaml'):
    with open(config_path, 'r') as file:
        return yaml.safe_load(file)

if __name__ == "__main__":
    config = load_config()
    
    # Load dataset
    if config['data']['use_custom_dataset']:
        dataset = load_dataset('conll2003', data_files={'train': f"{config['data']['dataset_path']}/{config['data']['custom_dataset_file']}"})
        dataset = dataset['train']
    else:
        dataset = load_and_mix_datasets()
    
    processed_dataset = dataset.map(preprocess, remove_columns=dataset.column_names)
    processed_dataset = processed_dataset.with_format('torch')
    train_dataset = processed_dataset.shuffle().select(range(int(len(processed_dataset)*0.8)))
    eval_dataset = processed_dataset.select(range(int(len(processed_dataset)*0.8), len(processed_dataset)))

    # Huấn luyện
    trainer = train_model(
        train_dataset, 
        eval_dataset, 
        model_name=config['model']['name'], 
        output_dir=config['model']['output_dir'],
        config=config
    )

    # Test với file
    file_path = f"{config['data']['input_dir']}/sample1.pdf"  # Thay bằng file thực tế
    text = extract_text_from_file(file_path)
    print("Extracted Text:", text[:500])

    mcq = extract_mcq_from_text(text, model_path=f"./models/{config['model']['output_dir']}")
    print("Extracted MCQ:", mcq)