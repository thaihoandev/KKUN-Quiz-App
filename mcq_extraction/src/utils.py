label_list = ['O', 'B-QUESTION', 'I-QUESTION', 'B-OPTION_A', 'I-OPTION_A', 
              'B-OPTION_B', 'I-OPTION_B', 'B-OPTION_C', 'I-OPTION_C', 
              'B-OPTION_D', 'I-OPTION_D', 'B-OPTION_E', 'I-OPTION_E']
label2id = {label: i for i, label in enumerate(label_list)}
id2label = {i: label for label, i in label2id.items()}