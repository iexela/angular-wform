import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormArray, FormControl } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { CharacterModel } from '../character-model.service';
import { CharacterThing, findThing, Thing, THINGS } from '../character.model';

@Component({
    selector: 'wform-character-things',
    templateUrl: 'character-things.component.html',
})
export class CharacterThingsComponent implements OnInit {
    displayedColumns = ['id', 'count', 'price', 'remove'];

    autoControl = new FormControl('');
    filteredThings!: Observable<Thing[]>;

    get moneyControl(): AbstractControl {
        return this.model.moneyControl;
    }

    get array(): FormArray {
        return this.model.thingsArray;
    }
    
    get balance(): number {
        return this.model.getBalance();
    }

    constructor(public model: CharacterModel,
                private snackBar: MatSnackBar) {

    }

    ngOnInit(): void {
        this.filteredThings = this.autoControl.valueChanges.pipe(
            startWith(''),
            map(name => {
                const result = THINGS.filter(t => t.name.toLowerCase().includes(name) && !this.model.hasThing(t.id));
                return result;
            }),
        );
    }

    getAutoThingName(thing: Thing): string {
        return '';
    }

    getThingName(id: string): string {
        const foundThing = findThing(id);
        return foundThing ? foundThing.name : '';
    }

    getThingId(index: number, thing: CharacterThing): string {
        return thing.id;
    }

    getThingCost(thing: CharacterThing): number {
        return thing.count * findThing(thing.id)!.price;
    }

    getTotalCost(): number {
        return this.model.getTotalCost();
    }

    onAdd(id: string): void {
        const thing = findThing(id);
        if (thing) {
            if (this.model.getBalance() >= thing.price) {
                this.model.addThing(id);
            } else {
                this.snackBar.open('Not enough money!', 'Dismiss', {
                    duration: 5000,
                });
            }
        }
    }

    onRemove(id: string): void {
        this.model.removeThing(id);
    }

    onGenerateMoney(): void {
        this.model.generateMoney();
    }
}
