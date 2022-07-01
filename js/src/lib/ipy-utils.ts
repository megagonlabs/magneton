import _ from "underscore";

export const ipy_function = function (code: string) {
  return new Promise<string>((resolve, reject) => {
    var callbacks: Jupyter.KernelExecuteCallbacks = {
      iopub: {
        output: (data) => {
          try {
            resolve(data.content.text.trim());
          } catch (error) {
            reject(
              `${_.get(data.content, "ename", "")}: ${_.get(
                data.content,
                "evalue",
                ""
              )}`
            );
          }
        },
      },
    };
    Jupyter.notebook.kernel.execute(
      `import json; print(json.dumps(${code}))`,
      callbacks
    );
  });
};
