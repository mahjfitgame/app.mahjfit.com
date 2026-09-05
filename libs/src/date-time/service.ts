// file: libs/src/date-time/service.ts
import { inject, Service } from '@angular/core';
import { ConfService } from '@libs/conf/service';
import { formatDate } from '@angular/common';

@Service()
export class DateTimeService {
    private readonly conf = inject(ConfService);

    constructor() {}

    // ---------- DATE ----------
    public dateValue(finfo: any): Date | null {
        const v = finfo.value ?? finfo.default ?? null;
        return this.parseToDate(v);
    }

    public dateDisplayValue(finfo: any): string {
        const date = this.dateValue(finfo);
        return this.formatWithConf(date, this.conf.formatDate);
    }

    public dateChange(finfo: any, value: Date | string | null): void {
        const date = this.parseToDate(value);
        finfo.value = this.formatWithConf(date, this.conf.formatDate) || null;
    }

    // ---------- TIME ----------
    public timeValue(finfo: any): Date | null {
        const v = finfo.value ?? finfo.default ?? null;
        return this.parseToDate(v);
    }

    public timeDisplayValue(finfo: any): string {
        const date = this.timeValue(finfo);
        return this.formatWithConf(date, this.conf.formatTime);
    }

    public timeChange(finfo: any, value: Date | string | null): void {
        const date = this.parseToDate(value);
        finfo.value = this.formatWithConf(date, this.conf.formatTime) || null;
    }

    // ---------- DATETIME ----------
    public dateTimeValue(finfo: any): Date | null {
        const v = finfo.value ?? finfo.default ?? null;
        return this.parseToDate(v);
    }

    public dateTimeDisplayValue(finfo: any): string {
        const date = this.dateTimeValue(finfo);
        return this.formatWithConf(date, this.conf.formatDateTime);
    }

    public dateTimeChange(finfo: any, value: Date | string | null): void {
        
        const date = this.parseToDate(value);
        finfo.value = this.formatWithConf(date, this.conf.formatDateTime) || null;
    }

    // ---------- Owl Aliases ----------
    // Since we don't use Luxon, the native Value methods return exactly what Owl needs!
    public owlDateValue(finfo: any): Date | null { return this.dateValue(finfo); }
    public owlDateDisplayValue(finfo: any): string { return this.dateDisplayValue(finfo); }
    public owlDateChange(finfo: any, value: Date | string | null): void { this.dateChange(finfo, value); }

    public owlTimeValue(finfo: any): Date | null { return this.timeValue(finfo); }
    public owlTimeDisplayValue(finfo: any): string { return this.timeDisplayValue(finfo); }
    public owlTimeChange(finfo: any, value: Date | string | null): void { this.timeChange(finfo, value); }

    public owlDateTimeValue(finfo: any): Date | null { return this.dateTimeValue(finfo); }
    public owlDateTimeDisplayValue(finfo: any): string { return this.dateTimeDisplayValue(finfo); }
    public owlDateTimeChange(finfo: any, value: Date | string | null): void { this.dateTimeChange(finfo, value); }

    // ---------- Range ----------
    public owlRangeValue(finfo: any): { from: Date | null; to: Date | null } {
        const value = finfo.value ?? finfo.default ?? null;
        if (!value) return { from: null, to: null };

        if (Array.isArray(value)) {
            return { from: this.parseToDate(value[0]), to: this.parseToDate(value[1]) };
        }
        return {
            from: this.parseToDate(value.from ?? value.start ?? null),
            to: this.parseToDate(value.to ?? value.end ?? null),
        };
    }

    public owlRangeChange(finfo: any, value: any[] | any | null): void {
        if (!value) {
            finfo.value = null;
            return;
        }
        let from: Date | null = null;
        let to: Date | null = null;

        if (Array.isArray(value)) {
            from = this.parseToDate(value[0]);
            to = this.parseToDate(value[1]);
        } else {
            from = this.parseToDate(value.from ?? value.start ?? null);
            to = this.parseToDate(value.to ?? value.end ?? null);
        }

        finfo.value = [
            this.formatWithConf(from, this.conf.formatDate) || null,
            this.formatWithConf(to, this.conf.formatDate) || null
        ];
    }

    // ---------- Core Native Helpers ----------
    private parseToDate(value: unknown): Date | null {
        if (!value) return null;
        if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
        
        if (typeof value === 'number') {
            const date = new Date(value);
            return isNaN(date.getTime()) ? null : date;
        }

        if (typeof value === 'string') {
            const raw = value.trim();
            if (!raw) return null;

            // Try standard native parsing first (works great for ISO)
            let timestamp = Date.parse(raw);
            if (!isNaN(timestamp)) {
                return new Date(timestamp);
            }

            // Circuit breaker: If it's your custom string 'd MMM yyyy' etc., 
            // fall back safely without triggering multi-pass dirty evaluation loops
            // You can return a safe fallback or use a lightweight manual string chunker if needed.
        }
        return null;
    }

    private formatWithConf(date: Date | null, format: string): string {
        if (!date) return '';
        // Uses Angular's native utility which natively recognizes 'd MMM yyyy hh:mm:ss aaa'
        return formatDate(date, format, this.conf.languageCode, this.conf.tz || undefined);
    }

    public clear(finfo: any): void {
        finfo.value = null;
    }
}