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
Route::get('/scraped_get', 'ScrapedDataController@getData')->name('scraped_data.getdata');
Route::get('/home1', 'HomeController@index')->name('home');
Route::get('/home', 'HomeController@index')->name('home');
Route::post('/sendmessage', 'ChatController@sendMessage');
Route::get('/admin_chat','HomeController@getAdminPage');