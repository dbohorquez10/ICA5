import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'countByEstado',
  standalone: false,
})
export class CountByEstadoPipe implements PipeTransform {
  transform(items: any[], estado: string): number {
    if (!items) return 0;
    return items.filter(i => i.estado === estado).length;
  }
}
