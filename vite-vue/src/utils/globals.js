export var $app = null;
export var $hero = null;
export var $inventory = null;

export const globals = () => {
    return {
        setInventory: (value) => $inventory = value,
        setHero: (value) => $hero = value,
        setApp: (value) => $app = value,
    }
}
