export const getAssetUrl = (assetPath: string): string => {
  try {

    if (import.meta.url) {
      return new URL(`../assets/${assetPath}`, import.meta.url).href;
    }
  } catch (error) {
    console.warn('Error using import.meta.url:', error);
  }
  
  return `/src/assets/${assetPath}`;
};
