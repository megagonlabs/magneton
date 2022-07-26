// Adapted from https://stackoverflow.com/a/35373030/18500364

/**
 * Measures the rendered width of arbitrary text given the font size and font face
 * @param {string} text The text to measure
 * @param {number} fontSize The font size in pixels
 * @param {string} fontFace The font face ("Arial", "Helvetica", etc.)
 * @returns {number} The width of the text
 **/
export const measureTextWidth = (() => {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d")!;

  return (text: string, fontSize: number, fontFace: string = "Arial") => {
    context.font = fontSize + "px " + fontFace;
    return context.measureText(text).width;
  };
})();
