export interface ItemStructureDto
{
    id: number;
    name: string;
    type: string;
    sprite: string;
    altitude: number;
    isUsable: boolean;
    isMovable: boolean;
    isPickupable: boolean;
    isBlockingCreatures: boolean;
    isBlockingItems: boolean;
}
