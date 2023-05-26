sap.ui.define([
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/core/Fragment"
], function (BaseController, JSONModel, Filter, FilterOperator, Fragment) {
    "use strict";

    return BaseController.extend("freestylecrudrecomenda.controller.Worklist", {

        /* =========================================================== */
        /* lifecycle methods                                           */
        /* =========================================================== */

        /**
         * Called when the worklist controller is instantiated.
         * @public
         */
        onInit : function () {
            var oViewModel;

            // keeps the search state
            this._aTableSearchState = [];

            // Model used to manipulate control states
            oViewModel = new JSONModel({
                worklistTableTitle : this.getResourceBundle().getText("worklistTableTitle"),
                shareSendEmailSubject: this.getResourceBundle().getText("shareSendEmailWorklistSubject"),
                shareSendEmailMessage: this.getResourceBundle().getText("shareSendEmailWorklistMessage", [location.href]),
                tableNoDataText : this.getResourceBundle().getText("tableNoDataText")
            });
            this.setModel(oViewModel, "worklistView");

            //Forma A de preencher Combobox 1 com dados bobos locais
            var Listbox = [
                {code:'0001',desc: 'teste 1'},
                {code:'0002',desc: 'teste 2'}
            ];
            console.log(Listbox);
            var oViewModelListbox = new JSONModel({items:Listbox});
            this.getView().setModel(oViewModelListbox, "ViewModelListbox");

            //Forma B de preencher Combobox 2 com dados reais da tabela do S/4
            var oViewModelListbox2 = new sap.ui.model.odata.v2.ODataModel("/sap/opu/odata/sap/Z270CRUD_RECOMENDA_SRV");
            this.getView().setModel(oViewModelListbox2, "ViewModelListbox2");
            
            oViewModelListbox2.read("/Z270IMPLGUIDANCESet", {
              success: function(oData){ 
                console.log(oData);
                var formattedDados = [];
                let linha = {};
                for (let oDataLine of oData.results) {
                  linha.Implementationguidance      = oDataLine.Implementationguidance;
                  linha.Implementationguidancetext  = oDataLine.Implementationguidancetext;
                  formattedDados.push(linha);
                  linha = {};
                };
                console.log(formattedDados);
                var oViewModelListbox2a = new JSONModel({items:formattedDados});
                this.getView().setModel(oViewModelListbox2a,"ViewModelListbox2a");
              }.bind(this),
              error: function(e){
                // debugger;
                console.error(e);
              }.bind(this)
            });


        },

        /* =========================================================== */
        /* event handlers                                              */
        /* =========================================================== */

        /**
         * Triggered by the table's 'updateFinished' event: after new table
         * data is available, this handler method updates the table counter.
         * This should only happen if the update was successful, which is
         * why this handler is attached to 'updateFinished' and not to the
         * table's list binding's 'dataReceived' method.
         * @param {sap.ui.base.Event} oEvent the update finished event
         * @public
         */
        onUpdateFinished : function (oEvent) {
            // update the worklist's object counter after the table update
            var sTitle,
                oTable = oEvent.getSource(),
                iTotalItems = oEvent.getParameter("total");
            // only update the counter if the length is final and
            // the table is not empty
            if (iTotalItems && oTable.getBinding("items").isLengthFinal()) {
                sTitle = this.getResourceBundle().getText("worklistTableTitleCount", [iTotalItems]);
            } else {
                sTitle = this.getResourceBundle().getText("worklistTableTitle");
            }
            this.getModel("worklistView").setProperty("/worklistTableTitle", sTitle);
        },

        /**
         * Event handler when a table item gets pressed
         * @param {sap.ui.base.Event} oEvent the table selectionChange event
         * @public
         */
        onPress : function (oEvent) {
            // The source is the list item that got pressed
            this._showObject(oEvent.getSource());
        },

        /**
         * Event handler for navigating back.
         * Navigate back in the browser history
         * @public
         */
        onNavBack : function() {
            // eslint-disable-next-line sap-no-history-manipulation
            history.go(-1);
        },


        onSearch : function (oEvent) {
            if (oEvent.getParameters().refreshButtonPressed) {
                // Search field's 'refresh' button has been pressed.
                // This is visible if you select any main list item.
                // In this case no new search is triggered, we only
                // refresh the list binding.
                this.onRefresh();
            } else {
                var aTableSearchState = [];
                var sQuery = oEvent.getParameter("query");

                if (sQuery && sQuery.length > 0) {
                    aTableSearchState = [new Filter("RecoCode", FilterOperator.Contains, sQuery)];
                }
                this._applySearch(aTableSearchState);
            }

        },

        /**
         * Event handler for refresh event. Keeps filter, sort
         * and group settings and refreshes the list binding.
         * @public
         */
        onRefresh : function () {
            var oTable = this.byId("table");
            oTable.getBinding("items").refresh();
        },

        /* =========================================================== */
        /* internal methods                                            */
        /* =========================================================== */

        /**
         * Shows the selected item on the object page
         * @param {sap.m.ObjectListItem} oItem selected Item
         * @private
         */
        _showObject : function (oItem) {
            this.getRouter().navTo("object", {
                objectId: oItem.getBindingContext().getPath().substring("/Z270RECOMENDATIOSet".length)
            });
        },

        /**
         * Internal helper method to apply both filter and search state together on the list binding
         * @param {sap.ui.model.Filter[]} aTableSearchState An array of filters for the search
         * @private
         */
        _applySearch: function(aTableSearchState) {
            var oTable = this.byId("table"),
                oViewModel = this.getModel("worklistView");
            oTable.getBinding("items").filter(aTableSearchState, "Application");
            // changes the noDataText of the list in case there are no filter results
            if (aTableSearchState.length !== 0) {
                oViewModel.setProperty("/tableNoDataText", this.getResourceBundle().getText("worklistNoDataWithSearchText"));
            }
        },

        onPopupPress: function() {
          if (!this.pDialog) {
              debugger;
              this.pDialog = Fragment.load({ // API since 1.58
                id: this.getView().getId(),
                name: "freestylecrudrecomenda.view.UpdateFields"
              });
          };
          this.pDialog.then(function(oDialog) {
            if(oDialog){
              oDialog.open();
            }
          });
        },

        onPopupPress2: function (oEvent) {
          var oSourceControl = oEvent.getSource();
          this._getMessagePopover().then(function (oDialog) {
            oDialog.openBy(oSourceControl);
          });
        },

        // método para instanciar o fragment
        _getMessagePopover: function () {
          var oView = this.getView();
          var oDialog = oView.byId("dialog");

          // cria popover
          // se não tem instância, criar a instância
          if (!this._pMessagePopover) {
            this._pMessagePopover = Fragment.load({ //sap.ui.core.Fragment.load
              id: oView.getId(),
              name: "freestylecrudrecomenda.view.UpdateFields"
            }).then(function (oDialog) {
              // connect dialog to the root view of this component (models)
              oView.addDependent(oDialog);
              return oDialog;
            });
          }
          // se ja tem instancia, retorna instancia criada
          return this._pMessagePopover;
        },

        onPopupPress3 : function () {
          var oView = this.getView();
          var oDialog = oView.byId("dialog");
          // create dialog lazily
          if (!oDialog) {
              var oFragmentController = {
                  onCloseDialog : function () {
                      oDialog.close();
                  }
              };
              // create dialog via fragment factory
              oDialog = sap.ui.xmlfragment(oView.getId(), "freestylecrudrecomenda.view.UpdateFields", oFragmentController);
              // connect dialog to the root view of this component (models, lifecycle)
              oView.addDependent(oDialog);
          }
          oDialog.open();
        },

        //Fragment function
        onUpdatePress: function(oEvent) {
          
        },

        onCloseDialog: function() {
          this.byId("helloDialog").close();
        },
    });
});
