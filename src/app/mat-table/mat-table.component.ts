import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, FormGroupName, FormControl } from '@angular/forms';
import { IProduct } from './product';
import { MatTableDataSource, MatTable } from '@angular/material';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { throwError } from 'rxjs';
import { startWith, tap, delay } from 'rxjs/operators';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';


const DEMO_DATA: IProduct[] = [
  { id: 1, brand: "Alete", productName: "Langweilige Karotte", price: 1.29 },
  { id: 2, brand: "Gut & Billig", productName: "Klopapier", price: 13.99 },
  { id: 3, brand: "Alete", productName: "Spinat zum Kotzen", price: 1.19 },
  { id: 4, brand: "LU", productName: "Tee-Gebäck, extrafein", price: 2.29 },
  { id: 5, brand: "Alete", productName: "Pastinaken, labbrig", price: 1.09 },
  { id: 6, brand: "Gut & Billig", productName: "Handdesinfektion", price: 19.99 },
  { id: 7, brand: "Alete", productName: "Kartoffel-Gurke, salzlos", price: 1.49 },
  { id: 8, brand: "LU", productName: "Butterkekse, klein", price: 0.89 },
  { id: 9, brand: "LU", productName: "Butterkekse, groß", price: 1.89 },
  { id: 10, brand: "Gut & Billig", productName: "Mundschutz, 20er", price: 199.99 },
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

  displayColumns = ['drag', 'id', 'brand', 'productName', 'price', 'actions'];

  sortActive: boolean = false;
  idCnt: number = 100; // trivial counter to give new rows a number starting with 100+1

  dataString: string = ""; // just a string representing the data pretty printed 

  // paginator with extra service: if someone changes the paginator, this is
  // directly forwarded to the DataSource object
  private _paginator: MatPaginator;
  @ViewChild(MatPaginator, { static: true }) set paginator(mp: MatPaginator) {
    this._paginator = mp;
    if (this.dataSource) this.dataSource.paginator = this._paginator;
  }

  // sort with extra service: forward the new sort value to DataSource
  _sort: MatSort;
  @ViewChild(MatSort, { static: true }) set sort(srt: MatSort) {
    this._sort = srt;
    if (this.dataSource) {
      this.dataSource.sort = this._sort;
    }
  }

  @ViewChild(MatTable, { static: true }) table: MatTable<any>;

  constructor(private fb: FormBuilder) {
    this.formBuilder = fb;

    this.formGroup = this.formBuilder.group({
      tableData: this.formBuilder.array([]) // init with empty data
    });

  }

  ngOnInit() {

    /* This is the fishy part of the game: Material Table is meant to use it with 
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
    // search for "[dataSource]" and "[formGroup]" to finde the location.

    this.dataSource.paginator = this._paginator;
    this.dataSource.sort = this._sort;

    // if someone clicks the column header to sort, also flip back to page 0
    this._sort.sortChange.subscribe(() => { this._paginator.pageIndex = 0 });

    // because every data row is now a FormGroup object and not a simple scalar,
    // what is the comparison operator then? 
    //
    // Most examples in the internet show how to use an array of objects as dataSource. 
    // But these Objects then have only scalars as property values.
    //
    // We do have nested objects, so we have to implement a value accessor instead of 
    // letting the table use the default implementation
    this.dataSource.sortingDataAccessor = (item, property) => {
      return item.get(property).value;
    };

    // to make visible to you as developer, the content of this.formGroup.value we better do NOT
    // use "{{ formGroup.value }}"" in the HTML, because this will generate
    // an "Expression has changed after it was checked" error sometimes. This error
    // shows a concurrency problem to us: data has changed while Angular is still
    // preparing the view. What to render, the old or the new value?
    // See also the very instructive blog entry at
    // https://blog.angular-university.io/angular-debugging/
    // 
    this.formGroup.valueChanges.pipe(
      // startWith: send starting "change", otherwise the info for you, developer, would 
      // only be shown below the table after interaction with the form fields in the table
      startWith(this.formGroup.value), 
      delay(0), // this prevents the mentioned error
      tap((item) => {
        this.dataString = JSON.stringify(item, undefined, 4);
      })).subscribe();

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
    const empty: IProduct = { id: ++this.idCnt, brand: null, productName: null, price: null };
    let newFg: FormGroup = this.formBuilder.group(empty);

    // if FormArray of main FormGRoup this.formGroup was not initialized before, do so
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
  removeRow(idOfDataToRemove: number): void {
    const fa: FormArray = this.formGroup.get('tableData') as FormArray;

    if (!fa || !idOfDataToRemove) return; // react gentle to bad calling habits ;-)

    for (let row = 0; row < fa.length; ++row) {
      if (fa.at(row).value.id == idOfDataToRemove) {
        fa.removeAt(row);
        break;
      }
    }

    // Material Table is designed for immuable data. So, because we delete a row,
    // we have also to tell the Material Table to re-render the rows. *sigh*
    this.dataSource._updateChangeSubscription();
  }

  // there shall be a Angular table index "dataIndex". You can find it in the internet,
  // but it does not work. Hell knows why. So, we do some trivial math:
  viewRow2dataRow(viewRow: number): number {
    return this._paginator.pageSize * this._paginator.pageIndex + viewRow;
  }

  // receives drop events from Angular Material CDK drag and drop support
  onDrop(event: CdkDragDrop<any>): void {

    // due to an Angular problem with event.previousIndex (search google for many 
    // complaints without solutions), we have to calculate the previous index on our own.
    // indexOf() is simple enough, but note, that we need to inject event.item.data
    // on our own in the HTML template via [cdkDragData]. Search for tag TAG_A35T6 there 
    // to find the location.
    // Because we search here in the data and not in the view, pagination correction
    // is obsolete.
    const computedPreviousIndex = event.container.data.indexOf(event.item.data, 0);

    // we need to correct the view index, that suffers from pagination, into the
    // real data index.
    const computedCurrentIndex = this.viewRow2dataRow(event.currentIndex);


    if (computedPreviousIndex == computedCurrentIndex) return;

    const tmp: IProduct[] = event.container.data;

    // now it's time to switch the elements in the ... where?
    // (1) FormArray ?
    // (2) event.container.data ?
    //
    // Most DnD examples on the internet will process pure array data
    // and not a "FormGroup with FormArray of FormRoups".
    // If we simply do a
    //
    //    moveItemInArray(event.container.data, computedPreviousIndex, computedCurrentIndex);
    //
    // then, yes, MatTable will redraw the rows in a different sequence.
    // BUT: formGroup.value will NOT reflect this change until a user interaction with 
    // one of the FormArray's FormControls and hence incites Agular to recalculate the 
    // inner states inside the FormArray. 
    //
    // There is a pull request on GitHub to add moveControl(from, to) member function
    // to FormArray:(12/2019, in 03/2020 still pending)
    // https://github.com/angular/angular/pull/27222/commits/2cd8746e1db1ddc51f535d357c293c197b55b9da
    //


    // In the mean time we have to help ourselfs
    // instead of "moveItemInArray(tmp, computedPreviousIndex, computedCurrentIndex);"
    const fa: FormArray = this.formGroup.get('tableData') as FormArray
    const dir = computedCurrentIndex > computedPreviousIndex ? 1 : -1;
    const moveMe = fa.at(computedPreviousIndex) as FormControl;

    // as sequence usually plays a role, if you offer DnD, changing the sequence means
    // to have touched the dragged row as well as all moved rows.
    // so, let's mark them so here and inside the loop
    moveMe.markAsTouched(); 
    moveMe.markAsDirty();
    for (let i = computedPreviousIndex; (i * dir) < (computedCurrentIndex * dir); i += dir) {
      const fc: FormControl = fa.at(i + dir) as FormControl;
      fc.markAsTouched();
      fc.markAsDirty();
      fa.setControl(i, fc);
    }
    fa.setControl(computedCurrentIndex, moveMe);

    // this.dataSource.data = [...tmp]; // shallow copy of array of FormGroups
    this.dataSource._updateChangeSubscription();

    console.log("FormArray after movement:", fa);
  }

  onSortChange(event: any) {
    this.sortActive = event.direction != "";
  }

  doAction() {
    console.log("main FormGroup:", this.formGroup);
  }
}
