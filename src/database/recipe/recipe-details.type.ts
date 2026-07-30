export type RecipeVisual = {
	description: string;
	id: string;
	imageUri?: string;
	title: string;
};

export type RecipeStep = {
	details: string[];
	id: string;
	title: string;
	visuals: RecipeVisual[];
};

export type RecipeDetail = {
	delivery: RecipeVisual[];
	heroVisuals: RecipeVisual[];
	packaging: RecipeVisual[];
	storeServing: RecipeVisual[];
	steps: RecipeStep[];
};
