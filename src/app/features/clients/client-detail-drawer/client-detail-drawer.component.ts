import { Component, Input, Output, EventEmitter, inject, OnChanges, SimpleChanges, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Client, ClientCart } from '../../../core/models/client.model';
import { ClientService } from '../../../core/services/client.service';

@Component({
  selector: 'app-client-detail-drawer',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './client-detail-drawer.component.html',
  styleUrl: './client-detail-drawer.component.css'
})
export class ClientDetailDrawerComponent implements OnChanges {
  @Input() client: Client | null = null;
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();
  @Output() edit = new EventEmitter<Client>();

  private clientService = inject(ClientService);
  private snack = inject(MatSnackBar);

  carts = signal<ClientCart[]>([]);
  isLoadingCarts = signal<boolean>(false);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['client'] && this.client) {
      this.loadClientCarts();
    }
  }

  loadClientCarts(): void {
    if (!this.client) return;

    this.isLoadingCarts.set(true);
    this.clientService.fetchClientCarts(this.client.id).subscribe({
      next: (carts) => {
        this.carts.set(carts);
        this.isLoadingCarts.set(false);
      },
      error: () => {
        this.carts.set([]);
        this.isLoadingCarts.set(false);
      }
    });
  }

  onClose(): void {
    this.close.emit();
  }

  onEdit(): void {
    if (this.client) {
      this.edit.emit(this.client);
    }
  }

  copyToClipboard(text: string, label: string): void {
    navigator.clipboard.writeText(text);
    this.snack.open(`${label} copiado al portapapeles`, 'Cerrar', { duration: 2500 });
  }
}
