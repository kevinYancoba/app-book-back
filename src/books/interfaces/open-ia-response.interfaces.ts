export interface OpenIaResponseIntefaces {
  id: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: { type: 'text'; text: string }[];
    };
  }[];
}
