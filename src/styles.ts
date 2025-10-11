let dynamicStyles = document.getElementById("dynamic-styles") as HTMLStyleElement;
if (!dynamicStyles) {
  dynamicStyles = document.createElement("style");
  dynamicStyles.id = "dynamic-styles";

  document.head.appendChild(dynamicStyles);
}

export const css = dynamicStyles.sheet as CSSStyleSheet;
