import Controller from '@ember/controller';
import { inject as service } from '@ember/service';
import Ember from 'ember';

export default class ApplicationController extends Controller {
  @service router;

  emberVersion = Ember.VERSION;
}
