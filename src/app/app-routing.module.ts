import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { MatTableComponent } from './mat-table/mat-table.component';


const routes: Routes = [
  { path: '', component: MatTableComponent },
  { path: '**', component: MatTableComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
