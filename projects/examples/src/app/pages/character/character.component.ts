import { Component } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CharacterModel } from './character-model.service';

type UIKind = 'no-ui' | 'accordion' | 'lazy-tabs';

const DEFAULT_SECTION_INDEX = 0;
const SECTIONS = ['profile', 'abilities', 'skills', 'things'];

@Component({
    selector: 'wform-character',
    templateUrl: 'character.component.html',
    viewProviders: [CharacterModel],
})
export class CharacterComponent {
    ui: UIKind = 'accordion';
    selectedTabIndex: number = DEFAULT_SECTION_INDEX;

    private openedPanels: string[] = [SECTIONS[DEFAULT_SECTION_INDEX]];
    
    constructor(private snackBar: MatSnackBar,
                public model: CharacterModel) {
    }

    isPanelOpened(panel: string): boolean {
        return this.openedPanels.includes(panel);
    }

    onUiChanged(ui: UIKind): void {
        this.ui = ui;
        this.selectSection(DEFAULT_SECTION_INDEX);
    }

    onSubmit(): void {
        const { form } = this.model;
        if (form.invalid) {
            form.markAllAsTouched();
            if (this.ui === 'no-ui') {
                this.ui = 'accordion';
            }
            SECTIONS.some(section => {
                if (form.get(section).invalid) {
                    this.selectSection(section);
                    return true;
                }
                return false;
            })
            this.snackBar.open('Fix errors on the form, please', 'Dismiss', {
                duration: 5000,
            });
        } else {
            this.snackBar.open('Your character has been created!', 'Dismiss', {
                duration: 5000,
            });
        }
    }

    private selectSection(section: string | number, only: boolean = true): void {
        const sectionIndex = typeof section === 'string' ? SECTIONS.indexOf(section) : section;
        this.selectedTabIndex = sectionIndex;
        if (only) {
            this.openedPanels = [SECTIONS[sectionIndex]];
        } else {
            this.openedPanels = SECTIONS.filter((s, i) => this.openedPanels.includes(s) || i === sectionIndex);
        }
    }
}
