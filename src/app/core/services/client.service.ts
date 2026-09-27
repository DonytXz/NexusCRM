import { Injectable, signal, computed, inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Client, ClientCart } from '../models/client.model';

interface DummyUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  image: string;
  role?: string;
  company?: {
    name: string;
    title: string;
    department: string;
  };
  address?: {
    city: string;
    address: string;
    postalCode: string;
    country?: string;
  };
}

interface DummyUsersResponse {
  users: DummyUser[];
  total: number;
}

@Injectable({
  providedIn: 'root'
})
export class ClientService {
  private http: HttpClient | null = null;
  private platformId: object | null = null;
  private isBrowser: boolean = typeof window !== 'undefined';

  private initialClients: Client[] = [
    {
      id: '1',
      name: 'Laura Martinez',
      email: 'laura@estevez.com.mx',
      country: 'MX',
      phone: '5512345678',
      company: 'Grupo Estevez',
      role: 'Chief Technology Officer',
      status: 'VIP',
      accountValue: 185000,
      city: 'Mexico City',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face',
      joinedDate: '2024-03-15',
      ordersCount: 14
    },
    {
      id: '2',
      name: 'Carlos Solano',
      email: 'carlos@techcorp.com',
      country: 'MX',
      phone: '5512345679',
      company: 'Tech Corp',
      role: 'Director of Procurement',
      status: 'Active',
      accountValue: 92000,
      city: 'Guadalajara',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
      joinedDate: '2024-06-20',
      ordersCount: 8
    }
  ];

  // Core Reactive Signals
  clients = signal<Client[]>(this.initialClients);
  isLoading = signal<boolean>(false);
  searchQuery = signal<string>('');
  selectedStatus = signal<string>('All');
  selectedDepartment = signal<string>('All');

  // Computed Executive CRM Metrics
  totalAccounts = computed(() => this.clients().length);

  activeAccounts = computed(() =>
    this.clients().filter(c => c.status === 'Active' || c.status === 'VIP').length
  );

  totalPipelineValue = computed(() =>
    this.clients().reduce((sum, c) => sum + (c.accountValue || 45000), 0)
  );

  averageAccountValue = computed(() => {
    const total = this.totalAccounts();
    return total > 0 ? Math.round(this.totalPipelineValue() / total) : 0;
  });

  // Filtered reactive dataset
  filteredClients = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const statusFilter = this.selectedStatus();

    return this.clients().filter(client => {
      const matchesSearch = !query ||
        client.name.toLowerCase().includes(query) ||
        client.email.toLowerCase().includes(query) ||
        client.company.toLowerCase().includes(query) ||
        (client.role && client.role.toLowerCase().includes(query)) ||
        (client.city && client.city.toLowerCase().includes(query));

      const matchesStatus = statusFilter === 'All' || client.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  });

  constructor() {
    try {
      this.http = inject(HttpClient, { optional: true });
      this.platformId = inject(PLATFORM_ID, { optional: true });
      if (this.platformId) {
        this.isBrowser = isPlatformBrowser(this.platformId);
      }
    } catch {
      this.http = null;
      this.isBrowser = typeof window !== 'undefined';
    }
    this.initClients();
  }

  private initClients(): void {
    if (!this.isBrowser) return;

    const saved = localStorage.getItem('nexus_clients_cache');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.clients.set(parsed);
          return;
        }
      } catch {
        localStorage.removeItem('nexus_clients_cache');
      }
    }

    // If no cache and HTTP client is available, fetch live public data from DummyJSON
    this.fetchPublicClients();
  }

  fetchPublicClients(): void {
    if (!this.http) return;

    this.isLoading.set(true);

    this.http.get<DummyUsersResponse>('https://dummyjson.com/users?limit=25')
      .pipe(
        map(res => {
          const publicClients: Client[] = res.users.map((u, index) => {
            const statuses: Array<'Active' | 'Pending' | 'VIP'> = ['Active', 'VIP', 'Active', 'Pending'];
            const assignedStatus = statuses[index % statuses.length];
            const accountVal = (u.id * 12500) + 35000;

            return {
              id: String(u.id + 10),
              name: `${u.firstName} ${u.lastName}`,
              email: u.email,
              phone: u.phone,
              country: u.address?.country || 'US',
              company: u.company?.name || 'Global Enterprise',
              role: u.company?.title || u.role || 'Senior Director',
              avatar: u.image || `https://i.pravatar.cc/150?img=${u.id}`,
              status: assignedStatus,
              accountValue: accountVal,
              city: u.address?.city || 'San Francisco',
              address: u.address?.address || '100 Market St',
              postalCode: u.address?.postalCode || '94105',
              joinedDate: `2024-0${(index % 8) + 1}-12`,
              ordersCount: (u.id % 12) + 2
            };
          });

          // Merge with initial core clients
          return [...this.initialClients, ...publicClients];
        }),
        catchError(err => {
          console.warn('Could not reach public DummyJSON API, using fallback data', err);
          return of(this.initialClients);
        })
      )
      .subscribe(loadedClients => {
        this.clients.set(loadedClients);
        this.isLoading.set(false);
        this.persistCache();
      });
  }

  fetchClientCarts(userId: string | number): Observable<ClientCart[]> {
    if (!this.http) {
      return of([]);
    }

    const numericId = typeof userId === 'string' ? parseInt(userId, 10) : userId;
    // Map id to valid DummyJSON user ID (1-30)
    const validId = isNaN(numericId) ? 1 : ((numericId % 30) || 1);

    return this.http.get<{ carts: ClientCart[] }>(`https://dummyjson.com/carts/user/${validId}`)
      .pipe(
        map(res => res.carts || []),
        catchError(() => of([]))
      );
  }

  addClient(clientData: Omit<Client, 'id'>): void {
    const newClient: Client = {
      ...clientData,
      id: crypto.randomUUID(),
      status: clientData.status || 'Active',
      accountValue: clientData.accountValue || 50000,
      avatar: clientData.avatar || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face`,
      joinedDate: new Date().toISOString().split('T')[0],
      ordersCount: 1
    };

    this.clients.update(current => [newClient, ...current]);
    this.persistCache();
  }

  updateClient(updatedClient: Client): void {
    this.clients.update(current =>
      current.map(c => c.id === updatedClient.id ? updatedClient : c)
    );
    this.persistCache();
  }

  deleteClient(id: string): void {
    this.clients.update(current => current.filter(c => c.id !== id));
    this.persistCache();
  }

  restoreClient(client: Client): void {
    this.clients.update(current => [client, ...current]);
    this.persistCache();
  }

  private persistCache(): void {
    if (this.isBrowser) {
      try {
        localStorage.setItem('nexus_clients_cache', JSON.stringify(this.clients()));
      } catch {
        // storage quota exceeded, fail silently
      }
    }
  }

  exportToCsv(): void {
    const data = this.filteredClients();
    let csv = 'ID,Name,Email,Company,Role,Status,Country,Phone,Account Value,City\n';

    data.forEach(c => {
      csv += `"${c.id}","${c.name}","${c.email}","${c.company}","${c.role || ''}","${c.status || 'Active'}","${c.country || 'MX'}","${c.phone}","${c.accountValue || 0}","${c.city || ''}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `nexus_clients_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
