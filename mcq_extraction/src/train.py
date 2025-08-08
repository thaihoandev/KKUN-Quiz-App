from transformers import (
    AutoModelForTokenClassification,
    AutoTokenizer,
    DataCollatorForTokenClassification,
    Trainer,
    TrainingArguments
)
import evaluate
import torch
import numpy as np
import yaml
import os
import logging
from utils import label_list
from preprocess import get_tokenized_datasets

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def validate_config(config):
    required_keys = [
        "model.name", "model.output_dir",
        "training.epochs", "training.batch_size",
        "training.warmup_steps", "training.weight_decay"
    ]
    for key in required_keys:
        parent, child = key.split(".")
        if parent not in config or child not in config[parent]:
            raise ValueError(f"Missing config key: {key}")
        if not isinstance(config[parent][child], (int, float, str)) or (isinstance(config[parent][child], (int, float)) and config[parent][child] <= 0):
            raise ValueError(f"Invalid value for {key}: {config[parent][child]}")

def train_model(
    train_dataset,
    eval_dataset,
    model_name,
    output_dir,
    config
):
    validate_config(config)
    os.makedirs(f"./results/{output_dir}", exist_ok=True)
    os.makedirs(f"./models/{output_dir}", exist_ok=True)
    os.makedirs("./results/logs", exist_ok=True)

    # 1) Tokenizer & collator
    tokenizer = AutoTokenizer.from_pretrained(model_name)
    data_collator = DataCollatorForTokenClassification(tokenizer)

    # 2) Model + gradient checkpointing
    try:
        model = AutoModelForTokenClassification.from_pretrained(
            model_name,
            num_labels=len(label_list)
        )
    except Exception as e:
        raise RuntimeError(f"Failed to load model {model_name}: {str(e)}")
    if config.get('model', {}).get('gradient_checkpointing', True):
        model.gradient_checkpointing_enable()

    # 3) Metric
    metric = evaluate.load("seqeval")
    def compute_metrics(p):
        preds, labels = p
        preds = np.argmax(preds, axis=2)
        true_preds = [
            [label_list[p] for (p, l) in zip(pred_seq, lab_seq) if l != -100]
            for pred_seq, lab_seq in zip(preds, labels)
        ]
        true_labels = [
            [label_list[l] for (p, l) in zip(pred_seq, lab_seq) if l != -100]
            for pred_seq, lab_seq in zip(preds, labels)
        ]
        res = metric.compute(predictions=true_preds, references=true_labels)
        return {
            "precision": res["overall_precision"],
            "recall":    res["overall_recall"],
            "f1":        res["overall_f1"],
            "accuracy":  res["overall_accuracy"],
        }

    # 4) FP16
    use_fp16 = torch.cuda.is_available() or torch.backends.mps.is_available()

    # 5) TrainingArguments
    training_args = TrainingArguments(
        output_dir=f"./results/{output_dir}",
        num_train_epochs=config["training"]["epochs"],
        per_device_train_batch_size=config["training"]["batch_size"],
        per_device_eval_batch_size=config["training"]["batch_size"],
        gradient_accumulation_steps=2,
        fp16=use_fp16,
        warmup_steps=config["training"]["warmup_steps"],
        weight_decay=config["training"]["weight_decay"],
        logging_dir="./results/logs",
        logging_steps=100,
        evaluation_strategy="epoch",
        save_strategy="epoch",
        load_best_model_at_end=True,
        metric_for_best_model="f1",
        dataloader_num_workers=4,
    )

    # 6) Trainer
    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=train_dataset,
        eval_dataset=eval_dataset,
        tokenizer=tokenizer,
        data_collator=data_collator,
        compute_metrics=compute_metrics,
    )

    try:
        trainer.train()
        trainer.save_model(f"./models/{output_dir}")
        tokenizer.save_pretrained(f"./models/{output_dir}")
    except Exception as e:
        raise RuntimeError(f"Training failed: {str(e)}")

    return trainer

if __name__ == "__main__":
    with open('config.yaml', 'r') as f:
        config = yaml.safe_load(f)
    model_name = config['model']['name']
    output_dir = config['model']['output_dir'].split('/')[-1]  # Extract dir name
    tokenizer = AutoTokenizer.from_pretrained(model_name)
    train_dataset, eval_dataset = get_tokenized_datasets(config, tokenizer)
    logger.info(f"Starting training with model {model_name}")
    train_model(train_dataset, eval_dataset, model_name, output_dir, config)
    logger.info("Training completed")