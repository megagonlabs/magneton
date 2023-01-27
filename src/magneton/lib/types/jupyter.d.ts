// The `Jupyter` global has no published type definitions.
// As a workaround, for type hints w. TypeScript, add to
// this type declaration as neccessary.
declare namespace Jupyter {
  const notebook: {
    kernel: {
      execute: (code: string, callbacks: KernelExecuteCallbacks) => {};
    };
  };

  interface KernelExecuteCallbacks {
    iopub?: { output: (data: { content: { text: string } }) => void };
  }
}
