import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, FormGroupName } from '@angular/forms';
import { IProduct } from './product';
import { MatTableDataSource } from '@angular/material';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { throwError } from 'rxjs';

const DEMO_DATA: IProduct[] = [
  { brand: "Alete", productName: "Langweilige Karotte", price: 1.29 },
  { brand: "Alete", productName: "Spinat zum Kotzen", price: 1.19 },
  { brand: "Alete", productName: "Pastinaken, labbrig", price: 1.09 },
  { brand: "Alete", productName: "Kartoffel-Gurke, slazlos", price: 1.49 },
  { brand: "LU", productName: "Tee-Gebäck, extrafein", price: 2.29 },
  { brand: "LU", productName: "Butterkekse, klein", price: 0.89 },
  { brand: "LU", productName: "Butterkekse, groß", price: 1.89 },
  { brand: "Gut & Billig", productName: "Klopapier", price: 13.99 },
  { brand: "Gut & Billig", productName: "Handdesinfektion", price: 19.99 },
  { brand: "Gut & Billig", productName: "Mundschutz, 20er", price: 199.99 },
];


@Component({
  selector: 'app-mat-table',
  templateUrl: './mat-table.component.html',
  styleUrls: ['./mat-table.component.css']
})
export class MatTableComponent implements OnInit {

  formGroup: FormGroup; // main FormGroup, bound to <form> element in HTML template
  formBuilder: FormBuilder; // store the injected FormBuilder from constructor for later use

  dataSource: MatTableDataSource<any>; // Material Table needs a DataSource implementation to carry data

  displayColumns = ['drag', 'index', 'brand', 'productName', 'price', 'actions'];

  // paginator with extra service: if someone changes the paginator, this is
  // directly forwarded to the DataSource object
  private _paginator: MatPaginator;
  @ViewChild(MatPaginator, { static: true }) set paginator(mp: MatPaginator) {
    this._paginator = mp;
    if (this.dataSource) this.dataSource.paginator = this._paginator;
  }

  // sort with extra service: forward the new sort value to DataSource
  private _sort: MatSort;
  @ViewChild(MatSort, { static: true }) set sort(srt: MatSort) {
    this._sort = srt;
    if (this.dataSource) {
      this.dataSource.sort = this._sort;
    }
  }


  constructor(private fb: FormBuilder) {
    this.formBuilder = fb;

    this.formGroup = this.formBuilder.group({
      tableData: this.formBuilder.array([]) // init with empty data
    });

  }

  ngOnInit() {

    /* This is the fishy part of the game: Materia Table is meant to use it with 
       immutable data, not with a inline editing setting. BUT WE DO SO!

      As a consequence we do two odd things here:

      (1) Use a "FormArray of FormGroups" as "data array" instead of a plain array of 
          objects as we find it in so many examples for Material Table

      (2) Tell Angualar at two locations, that the FormArray object carries the data
          (a) bind it to the <form> tag in html via the [formGroup] directive, but first
              (a.1) wrap it into a FormGroup.
          (b) bind it also to the Material Table inside the <form> via the [dataSource] 
              directive, but first 
              (b.1) wrap it into a MatTableDataSource<T>
    */

    let newFa: FormArray = this.arrayToFormGroupArray(DEMO_DATA); // this is (1)
    this.formGroup.setControl('tableData', newFa); // this is (2.a.1)
    this.dataSource = new MatTableDataSource(newFa.controls); // this is (2.b.1)

    // (2.a) and (2.b) still missing...well, they are carried out in the HTML template
    // search for "[dataSource]" and "[formGRoup]" to finde the location.

    this.dataSource.paginator = this._paginator;
    this.dataSource.sort = this._sort;

    // if someone clicks the column header to sort, flip back to page 0
    this._sort.sortChange.subscribe(() => { this._paginator.pageIndex = 0 });

    // because every data row is now a FormGroup object and not a simple scalar,
    // what is the comparison oprator then? 
    //
    // Most examples in the internet show how to use an array of objects as dataSource. 
    // But these Objects then have only scalars as property values.
    //
    // We do have nested objects, so we have to implement a value accessor instead of 
    // letting the table use the default implementation
    this.dataSource.sortingDataAccessor = (item, property) => {
      return item.get(property).value;
    };
  }

  /*
    This simply transforms an array of objcts into an FormArray of FormGroups.
    This simple implementation is only efficient, if ALL properties of the objects
    in the data array are meant to be transformed into FormControls in all the 
    FormGroup objects.
    */
  arrayToFormGroupArray(arr: any[]): FormArray {
    let fa: FormArray = new FormArray([]);

    arr.forEach(item => {
      let fg: FormGroup = this.fb.group(item);
      fa.push(fg);
    });

    return fa;
  }

  addNewRow(): void {
    const empty: IProduct = { brand: null, productName: null, price: null };
    let newFg: FormGroup = this.formBuilder.group(empty);

    // if FormArray fo main FormGRoup this.formGroup was not initialized before, do so
    if (!this.formGroup.get('tableData'))
      this.formGroup.setControl('tableData', new FormArray([]));

    // add as first element, and flip to page 0 to let is show
    (this.formGroup.get('tableData') as FormArray).insert(0, newFg);
    this._paginator.pageIndex = 0;

    // Material Table is designed for immuable data. So, because we add a row,
    // we have also to tell the Material Table to re-render the rows. *sigh*
    this.dataSource._updateChangeSubscription();
  }


  // remove a data row and re-render table. Note: We get here the view row number
  // as argument and not the data row number.
  removeRow(renderedRow: number): void {
    const fa: FormArray = this.formGroup.get('tableData') as FormArray;

    if (!fa || !renderedRow) return; // react gentle to bad calling habits ;-)

    // there shall be a Angular table index "dataIndex". You can find it in the internet,
    // but it does not work. Hell knows why. So, we do some trivial math:
    const row = this.viewRow2dataRow(renderedRow);

    if (row < 0 || row >= fa.length) // or react hefty to illegal arguments
      throwError(`index out of bounds when deleting data row #${row} / view row #${renderedRow}`);

    fa.removeAt(row);
    // Material Table is designed for immuable data. So, because we delete a row,
    // we have also to tell the Material Table to re-render the rows. *sigh*
    this.dataSource._updateChangeSubscription();
  }

  // there shall be a Angular table index "dataIndex". You can find it in the internet,
  // but it does not work. Hell knows why. So, we do some trivial math:
  viewRow2dataRow(viewRow: number): number {
    return  this._paginator.pageSize * this._paginator.pageIndex + viewRow;
  }

}
