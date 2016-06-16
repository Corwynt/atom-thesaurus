'use babel';

/* jshint esversion: 6 */
import { SelectListView } from 'atom-space-pen-views';

class ThesaurusView extends SelectListView {
  initialize(editor, synonyms, marker) {
    this.editor = editor;
    this.synonyms = synonyms;
    this.marker = marker;
    super.initialize(...arguments);
    this.addClass('synonyms popover-list');
    this.attach();
  }
  attach() {
    this.setItems(this.synonyms);
    this.overlayDecoration = this.editor.decorateMarker(this.marker, {
      type: 'overlay',
      item: this
    });
  }
  attached() {
    this.storeFocusedElement();
    this.focusFilterEditor();
  }
  confirmed(synonym) {
    this.cancel();
    if (!synonym) {
      return;
    }
    return this.editor.transact(()=>{
        this.editor.setSelectedBufferRange(this.marker.getRange());
        return this.editor.insertText(synonym);
    });
  }
  cancelled() {
    this.overlayDecoration.destroy();
    this.restoreFocus();
  }
  selectNextItemView() {
    super.selectNextItemView();
    return false;
  }
  selectPreviousItemView() {
    super.selectPreviousItemView();
    return false;
  }
  viewForItem(word) {
    var element = document.createElement('li');
    element.textContent = word;
    return element;
  }
  destroy() {
    this.cancel();
    this.remove();
  }
}
export default ThesaurusView;
