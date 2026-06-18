export type PhotoType =
  | "fundo-limpo"
  | "lifestyle"
  | "segurando"
  | "flat-lay"
  | "macro"
  | "ghost-mannequin";

export type Tool = "chatgpt" | "nano-banana";

export type ProductCategory =
  | "bebida"
  | "alimento"
  | "cosmetico"
  | "roupa"
  | "artesanal"
  | "acessorio"
  | "outro";

export interface ProductInfo {
  category: ProductCategory;
  name: string;
  color: string;
  material: string;
  size: string;
  hasLabel: boolean;
  labelText: string;
  labelPosition: string;
}

export interface SceneInfo {
  photoType: PhotoType;
  tool: Tool;
  scene: string;
  background: string;
  lightMood: string;
}

export interface GeneratedPrompt {
  promptEN: string;
  instructionsPT: string;
  toolTips: string;
  warnings: string[];
}
