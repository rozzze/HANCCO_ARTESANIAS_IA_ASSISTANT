import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { Stats } from '../models/stats.model';

@Injectable({ providedIn: 'root' })
export class StatsService {
  private readonly apiUrl = environment.apiUrl;
  private http = inject(HttpClient);

  obtener(): Observable<ApiResponse<Stats>> {
    return this.http.get<ApiResponse<Stats>>(`${this.apiUrl}/admin/stats`);
  }
}
