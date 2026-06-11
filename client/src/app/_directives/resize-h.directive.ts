import { Directive, HostListener, Input, Output, EventEmitter, ElementRef, OnDestroy } from '@angular/core';

@Directive({
    selector: '[appResizeH]'
})
export class ResizeHDirective implements OnDestroy {
    private oldX = 0;
    private isGrabbing = false;
    private resizeZoneWidth = 6;

    @Input() width: number;
    @Output() widthChange = new EventEmitter<number>();
    @Output() changeEnd = new EventEmitter<void>();

    constructor(private el: ElementRef) { }

    @HostListener('mousemove', ['$event'])
    onMouseMove(event: MouseEvent) {
        if (!this.isGrabbing) {
            const bounds = this.el.nativeElement.getBoundingClientRect();
            const offsetX = event.clientX - bounds.left;
            this.el.nativeElement.style.cursor = offsetX >= bounds.width - this.resizeZoneWidth ? 'ew-resize' : 'default';
            return;
        }
    }

    @HostListener('mousedown', ['$event'])
    onMouseDown(event: MouseEvent) {
        const bounds = this.el.nativeElement.getBoundingClientRect();
        const offsetX = event.clientX - bounds.left;

        if (offsetX >= bounds.width - this.resizeZoneWidth) {
            this.isGrabbing = true;
            this.oldX = event.clientX;

            window.addEventListener('mousemove', this.resizeHandler);
            window.addEventListener('mouseup', this.releaseHandler);

            event.preventDefault();
        }
    }

    private resizeHandler = (event: MouseEvent) => {
        if (!this.isGrabbing) {
            return;
        }
        this.width += (event.clientX - this.oldX);
        this.width = Math.max(160, Math.min(500, this.width));
        this.widthChange.emit(this.width);
        this.oldX = event.clientX;
    };

    private releaseHandler = () => {
        if (this.isGrabbing) {
            this.isGrabbing = false;
            this.changeEnd.emit();
            window.removeEventListener('mousemove', this.resizeHandler);
            window.removeEventListener('mouseup', this.releaseHandler);
        }
    };

    ngOnDestroy() {
        window.removeEventListener('mousemove', this.resizeHandler);
        window.removeEventListener('mouseup', this.releaseHandler);
    }
}
