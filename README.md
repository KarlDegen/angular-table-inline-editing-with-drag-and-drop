# Angular Material Table Inline Editing with Sorting, Pagination and Drag and Drop Support

Even when *Material Table* was not primarily designed for inline editing or drag and drop
we can still realize both of them. Even sorting and pagination.

A swiss watch maker would call this *grande complication*, and it is. We can find many
examples of *Material Table* on the internet as well as examples for pagination or sorting
or inline editing. 

But what is the consequence if it comes all together in one all singing all dancing example?

* inline editing
* drag and drop
* sorting
* pagination
* add/remove rows on user interaction

This example contains a lot of comments in the code. The comments address readers
that are at the start of programming Angular. So, if your're already a pro, some of them
might be unnecessary for you.

## Inline Editing

*Angular Table* utilizes DataSource from CDK or MatTableDataSource. As we want to use
sorting and pagination MatTableDataSource is the better choice. It already offers the slots
to place sorting and pagination logic.

For tables that only *show* data, all examples from the
[original documentation](https://material.angular.io/components/table/examples)
do not explain how to integrate FromControl elements in the table.
Same goes for drag and drop support. The examples there use arrays of JS objects as data source.

If we want to render input elements into the *Material Table* we better shall prepare
a FormGroup with a FormArray of one FormGroup per row and place it **twice** into the game

1. Bind the outer FormGroup into the \[formGroup\] property of \<form\> element
2. Create a MatTableDataSource from the FormArray and bind it to \[dataSource\] property
   of the \<MatTable\> element

Find comments in the code to explain how.

## Drag and Drop

*Darg and Drop* with list data is really fun with Angular. Only a few lines of code to achive
an attractive apprearance.

Again, the examples from the [original documentation](https://material.angular.io/cdk/drag-drop/examples)
show how to do this with list data and \<div\> but not how to do it with \<table\>.

There are examples on the internet that show how to achive this. But those examples mostly use
the handy method

    moveItemInArray(arrayData, previousIndex, currentIndex) // don't use in our case!

what works fine for shown but not editable array data. But we do not have an *array*, we do have a
*FormArray*. So we implement the logic ourselfs. Additional to just swap the FormGroup objects inside
the FormArray we also have to *touch* them and mark them *dirty* because apparently sequence of table rows 
matters if we offer drag and drop.

Additionally DnD shall be disabled, if the table has an activated sort. See there.

And, additionally we have to calulate the real data index from the view data index when unsing pagination. See there.


### Erroneus behavoiour of Angular DnD when used with tables

When the user drops an dragged table row, the function bound to \(cdkDropListDropped)\
is called. Inside the fired event we find the two properties:

* event.currentIndex
* event.previousIndex

You can rely on the fact, that currentIndes tells you the receiving position of *view* row. But
you *can not* rely on the rely on previousIndex. The Internet also knows this problem.

The solution is to investigate on the old position on outselfs. We need two steps to achive this

1. bind the real data of a row to the visual element in the HTML template  
   \[cdkDragData\]="row"
2. find the real data object index inside the real data array from the visual row data object bound by \[cdkDragData\]  
   const computedPreviousIndex = event.container.data.indexOf(event.item.data, 0);

Here we compare the complete data object by indexOf(). Of course we also could have used the
'id' data field of the example as it is a unique ID in our case.


## Sorting

Sorting goes nealy straight forward as in the examples of the original documentation. Two additional thing
we have to consider:

* a sorted table shall disable drag and drop
* as the row data is of type FormGroup and not a simple JS object we have to provide a
  mechanism to access the value to be compared by the sorting algorithm

In our case the latter can be realised simply by

    this.dataSource.sortingDataAccessor = (item, property) => {
      return item.get(property).value;
    };

## Pagination

Pagination is pretty simple with *Material Table* but also adds an additional complication: if you interact
with the **visible** part of the table, how to find the **real** row index you interact with?

The row index of the view has to take into account the page that is shown. The internet tells us just to
use the propety 'dataIndex' like:

    <td *matCellDef="let data;let i = dataIndex" ...> ... </td>

Just, it does not work, for whatever reason. So we have to calculate the real data row number
on ourselfs. Simple enough.

    viewRow2dataRow(viewRow: number): number {
        return this._paginator.pageSize * this._paginator.pageIndex + viewRow;
    }




# Technical Stuff

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `--prod` flag for a production build.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via [Protractor](http://www.protractortest.org/).

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).
