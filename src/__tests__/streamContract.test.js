import Ajv from "ajv";
import schema from "../schemas/streamChunk.json";

describe("Stream chunk contract", () => {
  const ajv = new Ajv();
  const validate = ajv.compile(schema);

  it.each([
    [{ token: "Hey" }],
    [{ token: "T", speaker: "georgy_zhukov", thread_id: "uuid-1" }],
    [{ token: "Y", speaker: null,    thread_id: null }],
  ])("accepts valid chunk %p", chunk => {
    expect(validate(chunk)).toBe(true);
  });

  it.each([
     [{},                         "required"],
     [{ token: "" },              "minLength"],
     [{ token: "Hi", extra: 1 },  "additionalProperties"],
     [{ token: "a", speaker: 123 },"type"],
   ])("rejects invalid chunk %p", (chunk, errKeyword) => {
     const valid = validate(chunk);
     expect(valid).toBe(false);
     // make sure at least one error uses our keyword
     expect(validate.errors.some(e => e.keyword === errKeyword)).toBe(true);
   });
});
