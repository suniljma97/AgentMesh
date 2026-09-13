export interface GoldenTaskExpectation {
  /** Output must mention this file path (substring match). */
  mustMentionFile?: string;
  /** Output must contain this literal text (substring match). */
  mustContainText?: string;
}

export interface GoldenTask {
  id: string;
  input: string;
  expect: GoldenTaskExpectation;
}
