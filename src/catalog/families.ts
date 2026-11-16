/**
 * The Egg Families and their Characters: plain static data with no React,
 * so the Garden core can read it. State refers to Characters and Egg
 * Families only by these stable ids, so adding an Egg Family later is
 * just a new entry here (plus its art).
 */

export type CharacterInfo = {
  /** Stable id stored in Garden state. Never rename one that has shipped. */
  id: string
  name: string
  /** What kind of creature it is, e.g. "bunny". */
  kind: string
}

export type EggFamily = {
  /** Stable id stored in Garden state. Never rename one that has shipped. */
  id: string
  name: string
  /** The Egg's pattern, which hints at what is inside. */
  pattern: string
  characters: readonly CharacterInfo[]
}

export type Catalog = readonly EggFamily[]

export const LAUNCH_CATALOG: Catalog = [
  {
    id: 'fluffy',
    name: 'Fluffy',
    pattern: 'Cream Egg with pastel spots; baby animals inside.',
    characters: [
      { id: 'bun-bun', name: 'Bun-Bun', kind: 'bunny' },
      { id: 'pip', name: 'Pip', kind: 'chick' },
      { id: 'mochi', name: 'Mochi', kind: 'kitten' },
      { id: 'hazel', name: 'Hazel', kind: 'hedgehog' },
      { id: 'pudding', name: 'Pudding', kind: 'puppy' },
    ],
  },
  {
    id: 'sparkly',
    name: 'Sparkly',
    pattern: 'Lavender Egg with glitter stars; magical creatures inside.',
    characters: [
      { id: 'twinkle', name: 'Twinkle', kind: 'unicorn' },
      { id: 'ember', name: 'Ember', kind: 'baby dragon' },
      { id: 'glimmer', name: 'Glimmer', kind: 'fairy fox' },
      { id: 'puff', name: 'Puff', kind: 'cloud sprite' },
      { id: 'pippa', name: 'Pippa', kind: 'pegasus' },
    ],
  },
  {
    id: 'splashy',
    name: 'Splashy',
    pattern: 'Aqua Egg with waves; sea creatures inside.',
    characters: [
      { id: 'bubbles', name: 'Bubbles', kind: 'octopus' },
      { id: 'shelly', name: 'Shelly', kind: 'turtle' },
      { id: 'finn', name: 'Finn', kind: 'narwhal' },
      { id: 'coral', name: 'Coral', kind: 'seahorse' },
      { id: 'waddles', name: 'Waddles', kind: 'penguin' },
    ],
  },
]

export function findCharacter(characterId: string, catalog: Catalog = LAUNCH_CATALOG): CharacterInfo | undefined {
  for (const family of catalog) {
    const character = family.characters.find((c) => c.id === characterId)
    if (character) return character
  }
  return undefined
}

export function findEggFamily(familyId: string, catalog: Catalog = LAUNCH_CATALOG): EggFamily | undefined {
  return catalog.find((family) => family.id === familyId)
}
