import { sound } from '@pixi/sound';

export default class SoundEffect {

    static load() {
        sound.add('inventoryOpen', 'sfx/inventory-open.mp3');
        sound.add('inventoryClose', 'sfx/inventory-close.mp3');
        sound.add('spikes', 'sfx/spikes.mp3');
        sound.add('click', 'sfx/click.wav');
        sound.add('confirm', 'sfx/confirm.mp3');
        sound.add('chest', 'sfx/chest.m4a');
        sound.add('footstep', 'sfx/footstep.m4a');
        sound.add('dead', 'sfx/dead.m4a');
        sound.add('mining', 'sfx/mining.m4a');
        sound.add('pickup', 'sfx/pickup.m4a');
        sound.add('potion', 'sfx/potion.m4a');
        sound.add('login', 'sfx/login.m4a');
        sound.add('background', 'sfx/background.m4a');
    }

    static play(id) {
        sound.play(id);
    }
}
