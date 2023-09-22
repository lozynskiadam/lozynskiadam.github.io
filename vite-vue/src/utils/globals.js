export var $app = null;
export var $hero = null;

export const globals = () => {
    return {
        setHero: (value) => $hero = value,
        setApp: (value) => $app = value,
    }
}
