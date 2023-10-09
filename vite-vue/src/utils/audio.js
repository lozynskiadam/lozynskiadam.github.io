export const audios = {
    inventoryOpen: new Audio('sfx/inventory-open.mp3'),
    inventoryClose: new Audio('sfx/inventory-close.mp3'),
    spikes: new Audio('sfx/spikes.mp3'),
    click: new Audio('sfx/click.wav'),
    confirm: new Audio('sfx/confirm.mp3'),
    chest: new Audio('sfx/chest.m4a'),
    footstep: new Audio('sfx/footstep.m4a'),
    dead: new Audio('sfx/dead.m4a'),
    mining: new Audio('sfx/mining.m4a'),
    pickup: new Audio('sfx/pickup.m4a'),
    potion: new Audio('sfx/potion.m4a'),
    login: new Audio('sfx/login.m4a'),
    background: new Audio('sfx/background.m4a'),
}
export const playAudio = function (name) {
    audios[name].currentTime = 0
    audios[name].play();
}
