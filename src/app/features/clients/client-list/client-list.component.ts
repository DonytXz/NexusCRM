import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';

import { ClientService } from '../../../core/services/client.service';
import { ClientFormComponent } from '../client-form/client-form.component';
import { ClientDetailDrawerComponent } from '../client-detail-drawer/client-detail-drawer.component';
import { Client } from '../../../core/models/client.model';

@Component({
  selector: 'app-client-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatSnackBarModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatProgressBarModule,
    MatTooltipModule,
    ClientDetailDrawerComponent
  ],
  templateUrl: './client-list.component.html',
  styleUrl: './client-list.component.css'
})
export class ClientListComponent implements OnInit {
  clientService = inject(ClientService);
  private dialog = inject(MatDialog);
  private snack = inject(MatSnackBar);

  displayedColumns: string[] = ['name', 'company', 'contact', 'accountValue', 'status', 'actions'];

  // Drawer State
  selectedClient = signal<Client | null>(null);
  isDrawerOpen = signal<boolean>(false);

  private countryDialCodes: Record<string, string> = {
    MX: '+52',
    US: '+1',
    ES: '+34'
  };

  formatPhone(client: Client): string {
    const dial = this.countryDialCodes[client.country ?? 'MX'] || '+1';
    return `${dial} ${client.phone}`;
  }

  ngOnInit(): void {
    const clients = this.clientService.clients();
    if (!clients || clients.length === 0) {
      this.clientService.fetchPublicClients();
    }
  }

  onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.clientService.searchQuery.set(input.value);
  }

  onStatusChange(status: string): void {
    this.clientService.selectedStatus.set(status);
  }

  refreshLiveApi(): void {
    this.clientService.fetchPublicClients();
    this.snack.open('Sincronizando cuentas con la API pública de DummyJSON...', 'OK', { duration: 3000 });
  }

  exportCsv(): void {
    this.clientService.exportToCsv();
    this.snack.open('Reporte exportado exitosamente', 'Cerrar', { duration: 2500 });
  }

  openClientDrawer(client: Client): void {
    this.selectedClient.set(client);
    this.isDrawerOpen.set(true);
  }

  closeClientDrawer(): void {
    this.isDrawerOpen.set(false);
  }

  openForm(client?: Client) {
    const dialogRef = this.dialog.open(ClientFormComponent, { data: client, width: '440px' });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (client) {
          const updated: Client = { ...client, ...result };
          this.clientService.updateClient(updated);
          if (this.selectedClient()?.id === client.id) {
            this.selectedClient.set(updated);
          }
          this.snack.open('Cliente actualizado', 'Cerrar', { duration: 3000 });
        } else {
          this.clientService.addClient(result);
          this.snack.open('Nuevo cliente registrado exitosamente', 'Cerrar', { duration: 3000 });
        }
      }
    });
  }

  delete(id: string) {
    const client = this.clientService.clients().find(c => c.id === id);
    if (!client) return;

    const confirmRef = this.snack.open(`¿Eliminar ${client.name}?`, 'Eliminar', { duration: 5000 });
    confirmRef.onAction().subscribe(() => {
      this.clientService.deleteClient(id);
      if (this.selectedClient()?.id === id) {
        this.closeClientDrawer();
      }

      const deletedRef = this.snack.open('Cliente eliminado', 'Deshacer', { duration: 5000 });
      deletedRef.onAction().subscribe(() => {
        this.clientService.restoreClient(client);
        this.snack.open('Acción revertida', 'Cerrar', { duration: 2000 });
      });
    });
  }
}
