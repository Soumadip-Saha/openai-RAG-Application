from typing import List


class PromptTemplate():
    def __init__(self, template: str, input_variables: List = []):
        self.template = template
        self.input_variables = input_variables

    def format_template(self, **kwargs):
        return self.template.format(**kwargs)
