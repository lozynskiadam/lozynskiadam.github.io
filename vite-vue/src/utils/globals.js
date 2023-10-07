export var $app = null;
export var $hero = null;
export var $inventory = null;
export var $vitality = null;

export const globals = () => {
    return {
        setVitality: (value) => $vitality = value,
        setInventory: (value) => $inventory = value,
        setHero: (value) => $hero = value,
        setApp: (value) => $app = value,
    }
}
