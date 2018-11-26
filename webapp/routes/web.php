<?php

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| contains the "web" middleware group. Now create something great!
|
*/

Route::get('/', 'AutoScraperController@index')->name('index');

Auth::routes();
Route::get('/scraped_data', 'ScrapedDataController@index')->name('scraped_data.index');
Route::get('/get_product_details/{id}', 'ScrapedDataController@getProductDetails')->name('scraped_data.get_product_details');
Route::get('/scraped_get', 'ScrapedDataController@getData')->name('scraped_data.getdata');
Route::get('/scraped_get_csv', 'ScrapedDataController@getCsvFile')->name('scraped_data.getcsvfile');
Route::get('/scraped_get_source', 'ScrapedDataController@getSourceNames')->name('scraped_data.getsourcenames');
Route::get('/home1', 'HomeController@index')->name('home');
Route::get('/home', 'HomeController@index')->name('home');
Route::post('/sendmessage', 'ChatController@sendMessage');
Route::get('/admin_chat','HomeController@getAdminPage');

Route::get('/url_list_data', 'UrlListDataController@index')->name('url_list.index');
Route::get('/url_list_get', 'UrlListDataController@getData')->name('url_list.getdata');
Route::post('/url_list_get', 'UrlListDataController@getData')->name('url_list.getdata');
Route::post('/url_list_update', 'UrlListDataController@update')->name('url_list.update');