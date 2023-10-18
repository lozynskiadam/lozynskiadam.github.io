import { sound } from '@pixi/sound';

export default class SoundEffect {

    static load() {
        sound.add('inventoryOpen', {url: 'sfx/inventory-open.mp3', preload: true});
        sound.add('inventoryClose', {url: 'sfx/inventory-close.mp3', preload: true});
        sound.add('spikes', {url: 'sfx/spikes.mp3', preload: true});
        sound.add('click', {url: 'sfx/click.wav', preload: true});
        sound.add('confirm', {url: 'sfx/confirm.mp3', preload: true});
        sound.add('chest', {url: 'sfx/chest.m4a', preload: true});
        sound.add('footstep', {url: 'sfx/footstep.m4a', preload: true});
        sound.add('dead', {url: 'sfx/dead.m4a', preload: true});
        sound.add('mining', {url: 'sfx/mining.m4a', preload: true});
        sound.add('pickup', {url: 'sfx/pickup.m4a', preload: true});
        sound.add('potion', {url: 'sfx/potion.m4a', preload: true});
        sound.add('login', {url: 'sfx/login.m4a', preload: true});
        sound.volumeAll = 0.25;
    }

    static play(id) {
        sound.play(id);
    }
}
