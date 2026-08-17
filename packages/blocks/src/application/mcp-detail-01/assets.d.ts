declare module "*.png" {
  const asset: string | { src: string };
  export default asset;
}

declare module "*.svg" {
  const asset: string | { src: string };
  export default asset;
}
