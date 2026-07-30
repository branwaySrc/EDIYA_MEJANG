import {
  openDatabaseAsync,
  type SQLiteDatabase,
} from "expo-sqlite";

export type RemoteRecipe = {
  id: string;
  name: string;
  category: string;
  ingredients: string[];
  steps: string[];
  imageFilename: string | null;
};

export type RecipesApiResponse =
  | {
      upToDate: true;
    }
  | {
      upToDate: false;
      version: string;
      recipes: RemoteRecipe[];
    };

export type LocalRecipe = RemoteRecipe;

export type RecipeSyncResult =
  | {
      status: "up-to-date";
      version: string | null;
    }
  | {
      status: "updated";
      version: string;
      recipeCount: number;
    };

type LocalRecipeRow = {
  id: string;
  name: string;
  category: string;
  ingredients: string;
  steps: string;
  image_filename: string | null;
};

type AppSettingRow = {
  value: string | null;
};

export const LOCAL_RECIPE_DATABASE_NAME = "my_shop_recipes.db";
export const RECIPE_VERSION_SETTING_KEY = "recipe_version";

let localRecipeDatabasePromise: Promise<SQLiteDatabase> | null = null;

export async function openLocalRecipeDatabaseAsync(): Promise<SQLiteDatabase> {
  localRecipeDatabasePromise ??= openDatabaseAsync(LOCAL_RECIPE_DATABASE_NAME);
  const db = await localRecipeDatabasePromise;

  await initializeLocalRecipeDatabaseAsync(db);

  return db;
}

export async function initializeLocalRecipeDatabaseAsync(
  db?: SQLiteDatabase
): Promise<void> {
  const database = db ?? (await openDatabaseAsync(LOCAL_RECIPE_DATABASE_NAME));

  await database.execAsync(`
CREATE TABLE IF NOT EXISTS local_recipes (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  ingredients TEXT NOT NULL,
  steps TEXT NOT NULL,
  image_filename TEXT
);

CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT
);
`);
}

export async function getStoredRecipeVersionAsync(
  db?: SQLiteDatabase
): Promise<string | null> {
  const database = db ?? (await openLocalRecipeDatabaseAsync());
  const row = await database.getFirstAsync<AppSettingRow>(
    "SELECT value FROM app_settings WHERE key = ?",
    RECIPE_VERSION_SETTING_KEY
  );

  return row?.value ?? null;
}

export async function readLocalRecipesAsync(
  db?: SQLiteDatabase
): Promise<LocalRecipe[]> {
  const database = db ?? (await openLocalRecipeDatabaseAsync());
  const rows = await database.getAllAsync<LocalRecipeRow>(
    "SELECT id, name, category, ingredients, steps, image_filename FROM local_recipes ORDER BY name ASC"
  );

  return rows.map(rowToLocalRecipe);
}

export async function syncRecipePackFromServer({
  apiBaseUrl,
  db,
  fetcher = fetch,
}: {
  apiBaseUrl: string;
  db?: SQLiteDatabase;
  fetcher?: typeof fetch;
}): Promise<RecipeSyncResult> {
  const database = db ?? (await openLocalRecipeDatabaseAsync());
  const currentVersion = await getStoredRecipeVersionAsync(database);
  const endpoint = buildRecipesEndpoint(apiBaseUrl, currentVersion);
  const response = await fetcher(endpoint);

  if (!response.ok) {
    throw new Error(`Recipe sync failed with HTTP ${response.status}.`);
  }

  const payload = validateRecipesApiResponse(await response.json());

  if (payload.upToDate) {
    return {
      status: "up-to-date",
      version: currentVersion,
    };
  }

  await database.withTransactionAsync(async () => {
    await database.runAsync("DELETE FROM local_recipes");

    for (const recipe of payload.recipes) {
      await database.runAsync(
        `
INSERT INTO local_recipes (
  id,
  name,
  category,
  ingredients,
  steps,
  image_filename
) VALUES (?, ?, ?, ?, ?, ?)
`,
        recipe.id,
        recipe.name,
        recipe.category,
        JSON.stringify(recipe.ingredients),
        JSON.stringify(recipe.steps),
        recipe.imageFilename
      );
    }

    await database.runAsync(
      `
INSERT INTO app_settings (key, value)
VALUES (?, ?)
ON CONFLICT(key) DO UPDATE SET value = excluded.value
`,
      RECIPE_VERSION_SETTING_KEY,
      payload.version
    );
  });

  return {
    status: "updated",
    version: payload.version,
    recipeCount: payload.recipes.length,
  };
}

function buildRecipesEndpoint(
  apiBaseUrl: string,
  currentVersion: string | null
): string {
  const endpoint = new URL("/api/recipes", normalizeApiBaseUrl(apiBaseUrl));

  if (currentVersion) {
    endpoint.searchParams.set("version", currentVersion);
  }

  return endpoint.toString();
}

function normalizeApiBaseUrl(apiBaseUrl: string): string {
  const trimmedBaseUrl = apiBaseUrl.trim();

  if (!trimmedBaseUrl) {
    throw new Error("apiBaseUrl is required to sync recipes.");
  }

  return trimmedBaseUrl.endsWith("/") ? trimmedBaseUrl : `${trimmedBaseUrl}/`;
}

function rowToLocalRecipe(row: LocalRecipeRow): LocalRecipe {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    ingredients: parseStringArray(row.ingredients, "ingredients", row.id),
    steps: parseStringArray(row.steps, "steps", row.id),
    imageFilename: row.image_filename,
  };
}

function parseStringArray(
  serializedValue: string,
  columnName: "ingredients" | "steps",
  recipeId: string
): string[] {
  const parsedValue: unknown = JSON.parse(serializedValue);

  if (
    !Array.isArray(parsedValue) ||
    parsedValue.some(item => typeof item !== "string")
  ) {
    throw new Error(
      `Invalid ${columnName} JSON stored for recipe "${recipeId}".`
    );
  }

  return parsedValue;
}

function validateRecipesApiResponse(value: unknown): RecipesApiResponse {
  if (!isRecord(value) || typeof value.upToDate !== "boolean") {
    throw new Error("Invalid recipes API response.");
  }

  if (value.upToDate === true) {
    return { upToDate: true };
  }

  if (
    typeof value.version !== "string" ||
    !Array.isArray(value.recipes) ||
    !value.recipes.every(isRemoteRecipe)
  ) {
    throw new Error("Invalid recipes API update payload.");
  }

  return {
    upToDate: false,
    version: value.version,
    recipes: value.recipes,
  };
}

function isRemoteRecipe(value: unknown): value is RemoteRecipe {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.category === "string" &&
    Array.isArray(value.ingredients) &&
    value.ingredients.every(item => typeof item === "string") &&
    Array.isArray(value.steps) &&
    value.steps.every(item => typeof item === "string") &&
    (typeof value.imageFilename === "string" || value.imageFilename === null)
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
