jQuery.sap.require("sap.ca.scfld.md.controller.BaseFullscreenController");
jQuery.sap.require("hcm.myleaverequest.utils.Formatters");
jQuery.sap.require("hcm.myleaverequest.utils.UIHelper");
jQuery.sap.require("sap.m.MessageBox");
jQuery.sap.require("hcm.myleaverequest.hcmmyleaverequestExtension.utils.DataManager");
jQuery.sap.require("hcm.myleaverequest.utils.ConcurrentEmployment");
jQuery.sap.require("hcm.myleaverequest.utils.CalendarTools");
jQuery.sap.require("sap.ca.ui.dialog.factory");
jQuery.sap.require("sap.ca.ui.dialog.Dialog");
jQuery.sap.require("sap.m.MessageToast");
jQuery.support.useFlexBoxPolyfill = false;
jQuery.sap.require("sap.ca.ui.model.format.FileSizeFormat");
jQuery.sap.require("sap.ca.ui.message.message");
jQuery.sap.require("sap.ui.thirdparty.sinon");
sap.ui.controller("hcm.myleaverequest.hcmmyleaverequestExtension.view.S1Custom", {
	    extHookChangeFooterButtons: null,
	    extHookRouteMatchedHome: null,
	    extHookRouteMatchedChange: null,
	    extHookClearData: null,
	    extHookInitCalendar: null,
	    extHookTapOnDate: null,
	    extHookSetHighlightedDays: null,
	    extHookDeviceDependantLayout: null,
	    extHookSubmit: null,
	    extHookOnSubmitLRCfail: null,
	    extHookOnSubmitLRCsuccess: null,
	    extHookCallDialog: null,
	    onInit: function () {
	        sap.ca.scfld.md.controller.BaseFullscreenController.prototype.onInit.call(this);
	        this.oApplication = this.oApplicationFacade.oApplicationImplementation;
	        this.resourceBundle = this.oApplicationFacade.getResourceBundle();
	        this.oDataModel = this.oApplicationFacade.getODataModel();
	        hcm.myleaverequest.utils.DataManager.init(this.oDataModel, this.resourceBundle);
	        hcm.myleaverequest.utils.Formatters.init(this.resourceBundle);
	        hcm.myleaverequest.utils.CalendarTools.init(this.resourceBundle);
	        this.oDataModel = hcm.myleaverequest.utils.DataManager.getBaseODataModel();
	        this.oRouter.attachRouteMatched(this._handleRouteMatched, this);
	        this._buildHeaderFooter();
	        this._initCntrls();
			
	        sap.ui.getCore().getEventBus().subscribe("hcm.myleaverequest.LeaveCollection", "refresh", this._onLeaveCollRefresh, this);
	    },
	    _initCntrls: function () {
	        this.changeMode = false;
	        this.oChangeModeData = {};
	        this.selRange = {};
	        this.selRange.start = null;
	        this.selRange.end = null;
	        this.aLeaveTypes = [];
	        this.leaveType = {};
	        this.iPendingRequestCount = 0;
	        this.bSubmitOK = null;
	        this.bApproverOK = null;
	        this.oSubmitResult = {};
	        this.sApprover = "";
	        this.bSimulation = true;
	        this._isLocalReset = false;
	        this.oBusy = null;
	        this.formContainer = this.byId("LRS4_FRM_CNT_BALANCES");
	        this.timeInputElem = this.byId("LRS4_FELEM_TIMEINPUT");
	        this.balanceElem = this.byId("LRS4_FELEM_BALANCES");
	        this.noteElem = this.byId("LRS4_FELEM_NOTE");
	        this.timeFrom = this.byId("LRS4_DAT_STARTTIME");
	        this.timeTo = this.byId("LRS4_DAT_ENDTIME");
	        this.legend = this.byId("LRS4_LEGEND");
	        this.remainingVacation = this.byId("LRS4_TXT_REMAINING_DAYS");
	        this.bookedVacation = this.byId("LRS4_TXT_BOOKED_DAYS");
	        this.note = this.byId("LRS4_TXA_NOTE");
	        this.cale = this.byId("LRS4_DAT_CALENDAR");
	        this.slctLvType = this.byId("SLCT_LEAVETYPE");
	        this.calSelResetData = [];
	        this._initCalendar();
	        this._deviceDependantLayout();
	        this.objectResponse = null;
	        this.ResponseMessage = null;
	    },
	    _onLeaveCollRefresh: function () {
	        hcm.myleaverequest.utils.CalendarTools.clearCache();
	    },
	    onAfterRendering: function () {
	        var t = this;
	        $(window).on("orientationchange", function (e) {
	            t._orientationDependancies(e.orientation);
	        });
	        if (!sap.ui.getCore().getConfiguration().getRTL()) {
	            this.byId("LRS4_TXT_REMAININGDAY").onAfterRendering = function () {
	                jQuery(this.getDomRef()).css({ "text-align": "right" });
	            };
	            this.byId("LRS4_TXT_REMAINING_DAYS").onAfterRendering = function () {
	                jQuery(this.getDomRef()).css({
	                    "font-size": "1.5rem",
	                    "font-weight": "700",
	                    "text-align": "right"
	                });
	            };
	        } else {
	            this.byId("LRS4_TXT_REMAININGDAY").onAfterRendering = function () {
	                jQuery(this.getDomRef()).css({ "text-align": "left" });
	            };
	            this.byId("LRS4_TXT_REMAINING_DAYS").onAfterRendering = function () {
	                jQuery(this.getDomRef()).css({
	                    "font-size": "1.5rem",
	                    "font-weight": "700",
	                    "text-align": "left"
	                });
	            };
	        }
	        this.byId("LRS4_TXT_BOOKED_DAYS").onAfterRendering = function () {
	            jQuery(this.getDomRef()).css({
	                "font-size": "1.5rem",
	                "font-weight": "700"
	            });
	        };
	    },
	    _buildHeaderFooter: function () {
	        var _ = this;
	        this.objHeaderFooterOptions = {
	            sI18NFullscreenTitle: "",
	            oEditBtn: {
	                sId: "LRS4_BTN_SEND",
	                sI18nBtnTxt: "LR_SEND",
	                onBtnPressed: function (e) {
	                    _.onSendClick(e);
	                }
	            },
	            buttonList: [
	                {
	                    sId: "LRS4_BTN_CANCEL",
	                    sI18nBtnTxt: "LR_RESET",
	                    onBtnPressed: function (e) {
	                        _.onCancelClick(e);
	                    }
	                },
	                {
	                    sId: "LRS4_BTN_ENTITLEMENT",
	                    sI18nBtnTxt: "LR_BALANCE_TILE",
	                    onBtnPressed: function (e) {
	                        _.onEntitlementClick(e);
	                    }
	                },
	                {
	                    sId: "LRS4_BTN_HISTORY",
	                    sI18nBtnTxt: "LR_HISTORY_TILE",
	                    onBtnPressed: function (e) {
	                        _.onHistoryClick(e);
	                    }
	                }
	            ]
	        };
	        var m = new sap.ui.core.routing.HashChanger();
	        var u = m.getHash();
	        if (u.indexOf("Shell-runStandaloneApp") >= 0) {
	            this.objHeaderFooterOptions.bSuppressBookmarkButton = true;
	        }
	        if (this.extHookChangeFooterButtons) {
	            this.objHeaderFooterOptions = this.extHookChangeFooterButtons(this.objHeaderFooterOptions);
	        }
	    },
	    _handleRouteMatched: function (e) {
	        var _ = this;
	        if (e.getParameter("name") === "home") {
	            hcm.myleaverequest.utils.DataManager.init(this.oDataModel, this.resourceBundle);
	            this.objHeaderFooterOptions.sI18NFullscreenTitle = "LR_CREATE_LEAVE_TILE";
	            this.setHeaderFooterOptions(this.objHeaderFooterOptions);
	            hcm.myleaverequest.utils.UIHelper.setControllerInstance(this);
	            this.oChangeModeData = {};
	            this.changeMode = false;
	            this.byId("fileupload").setVisible(false);
	            this._clearData();
	            hcm.myleaverequest.utils.CalendarTools.clearCache();
	            var c = sap.ui.core.Component.getOwnerIdFor(this.getView());
	            var s = sap.ui.component(c).getComponentData().startupParameters;
	            var p;
	            if (s && s.pernr) {
	                p = s.pernr[0];
	                hcm.myleaverequest.utils.UIHelper.setPernr(p);
	            } else {
	                p = hcm.myleaverequest.utils.UIHelper.getPernr();
	            }
	            if (p) {
	                _.initializeView();
	            } else {
	                hcm.myleaverequest.utils.ConcurrentEmployment.getCEEnablement(this, function () {
	                    _.initializeView();
	                });
	            }
	            if (_.cale && _.cale.getSelectedDates().length === 0) {
	                _.setBtnEnabled("LRS4_BTN_SEND", false);
	            } else {
	                _.setBtnEnabled("LRS4_BTN_SEND", true);
	            }
	            if (this.extHookRouteMatchedHome) {
	                this.extHookRouteMatchedHome();
	            }
	        } else if (e.getParameter("name") === "change") {
	            hcm.myleaverequest.utils.DataManager.init(this.oDataModel, this.resourceBundle);
	            this.objHeaderFooterOptions.sI18NFullscreenTitle = "LR_TITLE_CHANGE_VIEW";
	            this.setHeaderFooterOptions(this.objHeaderFooterOptions);
	            hcm.myleaverequest.utils.UIHelper.setControllerInstance(this);
	            this.oChangeModeData = {};
	            this.changeMode = true;
	            this._clearData();
	            var a = e.getParameters().arguments.requestID;
	            var b = null, i;
	            var d = hcm.myleaverequest.utils.DataManager.getCachedModelObjProp("ConsolidatedLeaveRequests");
	            if (d) {
	                for (i = 0; i < d.length; i++) {
	                    if (d[i].RequestID == a) {
	                        b = d[i];
	                    }
	                }
	                if (b == null) {
	                    for (i = 0; i < d.length; i++) {
	                        if (d[i].LeaveKey == a) {
	                            b = d[i];
	                        }
	                    }
	                }
	            }
	            if (!b) {
	                jQuery.sap.log.warning("curntLeaveRequest is null", "_handleRouteMatched", "hcm.myleaverequest.view.S1");
	                this.oRouter.navTo("home", {}, true);
	            } else {
	                var f = hcm.myleaverequest.utils.Formatters.getDate(b.StartDate);
	                var g = hcm.myleaverequest.utils.Formatters.getDate(b.EndDate);
	                f = new Date(f.getUTCFullYear(), f.getUTCMonth(), f.getUTCDate(), 0, 0, 0);
	                g = new Date(g.getUTCFullYear(), g.getUTCMonth(), g.getUTCDate(), 0, 0, 0);
	                _.oChangeModeData.requestId = b.RequestID;
	                _.oChangeModeData.leaveTypeCode = b.AbsenceTypeCode;
	                _.oChangeModeData.startDate = f.toString();
	                _.oChangeModeData.endDate = g.toString();
	                _.oChangeModeData.requestID = b.RequestID;
	                _.oChangeModeData.noteTxt = b.Notes;
	                _.oChangeModeData.startTime = b.StartTime;
	                _.oChangeModeData.endTime = b.EndTime;
	                _.oChangeModeData.employeeID = b.EmployeeID;
	                _.oChangeModeData.changeStateID = b.ChangeStateID;
	                _.oChangeModeData.leaveKey = b.LeaveKey;
	                _.oChangeModeData.evtType = _._getCaleEvtTypeForStatus(b.StatusCode);
	                _.oChangeModeData.StatusCode = b.StatusCode;
	                _.oChangeModeData.ApproverEmployeeID = b.ApproverEmployeeID;
	                _.oChangeModeData.ApproverEmployeeName = b.ApproverEmployeeName;
	                _.oChangeModeData.WorkingHoursDuration = b.WorkingHoursDuration;
	                _.oChangeModeData.AttachmentDetails = b.AttachmentDetails;
	                _._setUpLeaveTypeData(_.oChangeModeData.leaveTypeCode);
	                _._copyChangeModeData();
	                if (_.cale.getSelectedDates().length > 1) {
	                    if (this.timeFrom) {
	                        this.timeFrom.setValue("");
	                        this.timeFrom.setEnabled(false);
	                    }
	                    if (this.timeTo) {
	                        this.timeTo.setValue("");
	                        this.timeTo.setEnabled(false);
	                    }
	                }
	                if (_.cale && _.cale.getSelectedDates().length === 0) {
	                    _.setBtnEnabled("LRS4_BTN_SEND", false);
	                } else {
	                    _.setBtnEnabled("LRS4_BTN_SEND", true);
	                }
	            }
	            if (this.extHookRouteMatchedChange) {
	                this.extHookRouteMatchedChange();
	            }
	        }
	    },
	    _copyChangeModeData: function () {
	        var _ = null;
	        var a = null;
	        var b = 0;
	        var c = 0;
	        if (this.oChangeModeData === {}) {
	            return;
	        }
	        this.selRange.start = this.oChangeModeData.startDate;
	        this.selRange.end = this.oChangeModeData.endDate;
	        if (this.selRange.start === this.selRange.end) {
	            this.selRange.end = null;
	            if (this.cale) {
	                this.cale.toggleDatesSelection([this.selRange.start], true);
	            }
	        } else {
	            if (this.cale) {
	                this.cale.toggleDatesRangeSelection(this.selRange.start, this.selRange.end, true);
	            }
	        }
	        if (this.cale) {
	            this.cale.setCurrentDate(this.selRange.start);
	            this._setHighlightedDays(this.cale.getCurrentDate());
	        }
	        this.requestID = this.oChangeModeData.requestID;
	        if (this.note) {
	            if (!!this.byId("LRS4_NOTE") && this.byId("LRS4_NOTE").getContent().length > 2)
	                this.byId("LRS4_NOTE").removeContent(1);
	            if (!!this.oChangeModeData.noteTxt && this.oChangeModeData.noteTxt !== "") {
	                var d = hcm.myleaverequest.utils.Formatters._parseNotes(this.oChangeModeData.noteTxt);
	                var t = "";
	                for (var i = 0; i < d.NotesCollection.length; i++) {
	                    t = t + d.NotesCollection[i].Author + ":" + d.NotesCollection[i].Text + "\n";
	                }
	                var n = new sap.m.Text({
	                    width: "100%",
	                    wrapping: true,
	                    layoutData: new sap.ui.layout.ResponsiveFlowLayoutData({ weight: 8 })
	                });
	                n.setText(t);
	                this.byId("LRS4_NOTE").insertContent(n, 1);
	            }
	        }
	        if (this.oChangeModeData.AttachmentDetails) {
	            var D = hcm.myleaverequest.utils.Formatters._parseAttachments(this.oChangeModeData.AttachmentDetails, this.oChangeModeData.RequestID, this.oDataModel);
	            if (D.AttachmentsCollection.length > 0) {
	                var e = new sap.ui.model.json.JSONModel(D);
	                this.byId("fileupload").setModel(e, "files");
	                this.byId("fileupload").setVisible(true);
	            } else {
	                this.byId("fileupload").setVisible(false);
	            }
	        }
	        if (typeof this.oChangeModeData.startTime === "string") {
	            if (this.timeFrom) {
	                if (this.oChangeModeData.startTime === "000000") {
	                    this.timeFrom.setValue("");
	                } else {
	                    this.timeFrom.setValue(this.oChangeModeData.startTime.substring(0, 2) + ":" + this.oChangeModeData.startTime.substring(2, 4));
	                }
	            }
	            if (this.timeTo) {
	                if (this.oChangeModeData.endTime === "000000") {
	                    this.timeTo.setValue("");
	                } else {
	                    this.timeTo.setValue(this.oChangeModeData.endTime.substring(0, 2) + ":" + this.oChangeModeData.endTime.substring(2, 4));
	                }
	            }
	        } else {
	            _ = new Date(this.oChangeModeData.startTime.ms);
	            b = _.getUTCHours();
	            c = _.getUTCMinutes();
	            b = (b < 10 ? "0" : "") + b;
	            c = (c < 10 ? "0" : "") + c;
	            if (this.timeFrom) {
	                this.timeFrom.setValue(b + ":" + c);
	            }
	            a = new Date(this.oChangeModeData.endTime.ms);
	            b = a.getUTCHours();
	            c = a.getUTCMinutes();
	            b = (b < 10 ? "0" : "") + b;
	            c = (c < 10 ? "0" : "") + c;
	            if (this.timeTo) {
	                this.timeTo.setValue(b + ":" + c);
	            }
	        }
	        if (this.cale & this.cale.getSelectedDates().length === 0) {
	            this.setBtnEnabled("LRS4_BTN_SEND", false);
	        } else {
	            this.setBtnEnabled("LRS4_BTN_SEND", true);
	        }
	        if (this.oChangeModeData.WorkingHoursDuration) {
	            this.byId("LRS4_ABS_HOURS").setValue(this.oChangeModeData.WorkingHoursDuration);
	        }
	    },
	    _clearData: function () {
	        if (!this.changeMode) {
	            this._clearDateSel();
	        }
	        if (this._isLocalReset) {
	            for (var i = 0; i < this.calSelResetData.length; i++) {
	                this.cale.toggleDatesType(this.calSelResetData[i].calEvt, this.calSelResetData[i].evtType, false);
	            }
	            this.calSelResetData = [];
	        }
	        if (!this.changeMode) {
	            this.oChangeModeData = {};
	        }
	        if (this.cale) {
	            this.cale.setCurrentDate(new Date());
	        }
	        if (this.note) {
	            this.note.setValue("");
	            if (!!this.byId("LRS4_NOTE") && this.byId("LRS4_NOTE").getContent().length > 2)
	                this.byId("LRS4_NOTE").removeContent(1);
	        }
	        if (this.timeFrom) {
	            this.timeFrom.setValue("");
	            this.timeFrom.rerender();
	            this.timeFrom.setEnabled(true);
	        }
	        if (this.timeTo) {
	            this.timeTo.setValue("");
	            this.timeTo.rerender();
	            this.timeTo.setEnabled(true);
	        }
	        if (this.byId("LRS4_ABS_HOURS")) {
	            this.byId("LRS4_ABS_HOURS").setValue("");
	            this.byId("LRS4_ABS_HOURS").rerender();
	            this.byId("LRS4_ABS_HOURS").setEnabled(true);
	        }
	        if (this.byId("fileUploader")) {
	            this.byId("fileUploader").setValue("");
	        }
	        this.setBtnEnabled("LRS4_BTN_SEND", false);
	        if (this.byId("LRS4_LBL_TITLE")) {
	            this.byId("LRS4_LBL_TITLE").setText(this.resourceBundle.getText("LR_TITLE_CREATE_VIEW"));
	        }
	        if (this.aLeaveTypes.length > 0 && this.changeMode === false && this._isLocalReset === true) {
	            this._setUpLeaveTypeData();
	        }
	        this._isLocalReset = false;
	        if (this.extHookClearData) {
	            this.extHookClearData();
	        }
	    },
	    _clearDateSel: function () {
	        if (this.cale) {
	            this.cale.unselectAllDates();
	        }
	        this.selRange.end = null;
	        this.selRange.start = null;
	        this.setBtnEnabled("LRS4_BTN_SEND", false);
	    },
	    _initCalendar: function () {
	        if (this.cale) {
	            this.cale.setSwipeToNavigate(true);
	            this.cale.attachChangeCurrentDate(this._onChangeCurrentDate, this);
	            this.cale.attachTapOnDate(this._onTapOnDate, this);
	            this.cale.setEnableMultiselection(false);
	            this.cale.setWeeksPerRow(1);
	        }
	        if (this.legend) {
	            this.legend.setLegendForNormal(this.resourceBundle.getText("LR_WORKINGDAY"));
	            this.legend.setLegendForType00(this.resourceBundle.getText("LR_NONWORKING"));
	            this.legend.setLegendForType01(this.resourceBundle.getText("LR_APPROVELEAVE"));
	            this.legend.setLegendForType04(this.resourceBundle.getText("LR_APPROVEPENDING"));
	            this.legend.setLegendForType06(this.resourceBundle.getText("LR_PUBLICHOLIDAY"));
	            this.legend.setLegendForType07(this.resourceBundle.getText("LR_REJECTEDLEAVE"));
	            this.legend.setLegendForToday(this.resourceBundle.getText("LR_DTYPE_TODAY"));
	            this.legend.setLegendForSelected(this.resourceBundle.getText("LR_DTYPE_SELECTED"));
	        }
	        if (this.extHookInitCalendar) {
	            this.extHookInitCalendar();
	        }
	    },
	    registerForOrientationChange: function (a) {
	        if (sap.ui.Device.system.tablet) {
	            this.parentApp = a;
	            a.attachOrientationChange(jQuery.proxy(this._onOrientationChanged, this));
	        }
	    },
	    _onOrientationChanged: function () {
	        this._leaveTypeDependantSettings(this.leaveType);
	    },
	    _onTapOnDate: function (e) {
	        var _;
	        if (this.cale) {
	            _ = this.cale.getSelectedDates();
	        }
	        if (this.leaveType.AllowedDurationMultipleDayInd === false) {
	        } else if (this.leaveType.AllowedDurationMultipleDayInd) {
	            if (_.length === 0) {
	                if (this.selRange.start !== null && this.selRange.end !== null) {
	                    this._clearDateSel();
	                    if (e.getParameters().date !== "") {
	                        this.selRange.start = e.getParameters().date;
	                        if (this.cale) {
	                            this.cale.toggleDatesSelection([this.selRange.start], true);
	                        }
	                    }
	                } else if (this.selRange.start !== null && this.selRange.end === null) {
	                    this._clearDateSel();
	                }
	            } else if (this.selRange.start === null) {
	                this.selRange.start = e.getParameters().date;
	            } else if (this.selRange.end === null) {
	                this.selRange.end = e.getParameters().date;
	                if (this.cale) {
	                    this.cale.toggleDatesRangeSelection(this.selRange.start, this.selRange.end, true);
	                }
	            } else {
	                this.selRange.start = e.getParameters().date;
	                this.selRange.end = null;
	                if (this.cale) {
	                    this.cale.toggleDatesSelection([this.selRange.start], true);
	                }
	            }
	        }
	        if (this.leaveType.AllowedDurationMultipleDayInd === true && this.timeFrom && this.timeTo) {
	            _ = this.cale.getSelectedDates();
	            if (_.length > 1) {
	                this.timeFrom.setValue("");
	                this.timeTo.setValue("");
	                this.byId("LRS4_ABS_HOURS").setValue("");
	                this.timeFrom.setEnabled(false);
	                this.timeTo.setEnabled(false);
	                this.byId("LRS4_ABS_HOURS").setEnabled(false);
	            } else {
	                this.timeFrom.setEnabled(true);
	                this.timeTo.setEnabled(true);
	                this.byId("LRS4_ABS_HOURS").setEnabled(true);
	            }
	        }
	        if (this.cale && this.cale.getSelectedDates().length === 0) {
	            this.setBtnEnabled("LRS4_BTN_SEND", false);
	        } else {
	            this.setBtnEnabled("LRS4_BTN_SEND", true);
	        }
	        if (this.extHookTapOnDate) {
	            this.extHookTapOnDate();
	        }
	    },
	    _setHighlightedDays: function (s) {
	        var _;
	        try {
	            _ = sap.me.Calendar.parseDate(s);
	        } catch (e) {
	            _ = new Date(s);
	        }
	        hcm.myleaverequest.utils.CalendarTools.getDayLabelsForMonth(_, this._getCalLabelsOK, this._getCalLabelsError);
	        if (this.extHookSetHighlightedDays) {
	            this.extHookSetHighlightedDays();
	        }
	    },
	    _getCalLabelsOK: function (c) {
	        var _ = hcm.myleaverequest.utils.UIHelper.getControllerInstance();
	        if (!!c.REJECTED && c.REJECTED.length > 0) {
	            _.cale.toggleDatesType(c.REJECTED, sap.me.CalendarEventType.Type00, false);
	            _.cale.toggleDatesType(c.REJECTED, sap.me.CalendarEventType.Type01, false);
	            _.cale.toggleDatesType(c.REJECTED, sap.me.CalendarEventType.Type04, false);
	            _.cale.toggleDatesType(c.REJECTED, sap.me.CalendarEventType.Type06, false);
	            _.cale.toggleDatesType(c.REJECTED, sap.me.CalendarEventType.Type07, true);
	            _.cale.toggleDatesType(c.REJECTED, sap.me.CalendarEventType.Type10, false);
	        }
	        if (!!c.SENT && c.SENT.length > 0) {
	            _.cale.toggleDatesType(c.SENT, sap.me.CalendarEventType.Type00, false);
	            _.cale.toggleDatesType(c.SENT, sap.me.CalendarEventType.Type01, false);
	            _.cale.toggleDatesType(c.SENT, sap.me.CalendarEventType.Type04, true);
	            _.cale.toggleDatesType(c.SENT, sap.me.CalendarEventType.Type06, false);
	            _.cale.toggleDatesType(c.SENT, sap.me.CalendarEventType.Type07, false);
	            _.cale.toggleDatesType(c.SENT, sap.me.CalendarEventType.Type10, false);
	        }
	        if (!!c.APPROVED && c.APPROVED.length > 0) {
	            _.cale.toggleDatesType(c.APPROVED, sap.me.CalendarEventType.Type00, false);
	            _.cale.toggleDatesType(c.APPROVED, sap.me.CalendarEventType.Type01, true);
	            _.cale.toggleDatesType(c.APPROVED, sap.me.CalendarEventType.Type04, false);
	            _.cale.toggleDatesType(c.APPROVED, sap.me.CalendarEventType.Type06, false);
	            _.cale.toggleDatesType(c.APPROVED, sap.me.CalendarEventType.Type07, false);
	        }
	        if (!!c.POSTED && c.POSTED.length > 0) {
	            _.cale.toggleDatesType(c.POSTED, sap.me.CalendarEventType.Type00, false);
	            _.cale.toggleDatesType(c.POSTED, sap.me.CalendarEventType.Type01, true);
	            _.cale.toggleDatesType(c.POSTED, sap.me.CalendarEventType.Type04, false);
	            _.cale.toggleDatesType(c.POSTED, sap.me.CalendarEventType.Type06, false);
	            _.cale.toggleDatesType(c.POSTED, sap.me.CalendarEventType.Type07, false);
	            _.cale.toggleDatesType(c.POSTED, sap.me.CalendarEventType.Type10, false);
	        }
	        if (!!c.WEEKEND && c.WEEKEND.length > 0) {
	            _.cale.toggleDatesType(c.WEEKEND, sap.me.CalendarEventType.Type00, true);
	            _.cale.toggleDatesType(c.WEEKEND, sap.me.CalendarEventType.Type07, false);
	            _.cale.toggleDatesType(c.WEEKEND, sap.me.CalendarEventType.Type04, false);
	            _.cale.toggleDatesType(c.WEEKEND, sap.me.CalendarEventType.Type01, false);
	            _.cale.toggleDatesType(c.WEEKEND, sap.me.CalendarEventType.Type06, false);
	            _.cale.toggleDatesType(c.WEEKEND, sap.me.CalendarEventType.Type10, false);
	        }
	        if (!!c.PHOLIDAY && c.PHOLIDAY.length > 0) {
	            _.cale.toggleDatesType(c.PHOLIDAY, sap.me.CalendarEventType.Type00, false);
	            _.cale.toggleDatesType(c.PHOLIDAY, sap.me.CalendarEventType.Type01, false);
	            _.cale.toggleDatesType(c.PHOLIDAY, sap.me.CalendarEventType.Type04, false);
	            _.cale.toggleDatesType(c.PHOLIDAY, sap.me.CalendarEventType.Type06, true);
	            _.cale.toggleDatesType(c.PHOLIDAY, sap.me.CalendarEventType.Type07, false);
	            _.cale.toggleDatesType(c.PHOLIDAY, sap.me.CalendarEventType.Type10, false);
	        }
	        if (!!c.WORKDAY && c.WORKDAY.length > 0) {
	            _.cale.toggleDatesType(c.WORKDAY, sap.me.CalendarEventType.Type00, false);
	            _.cale.toggleDatesType(c.WORKDAY, sap.me.CalendarEventType.Type01, false);
	            _.cale.toggleDatesType(c.WORKDAY, sap.me.CalendarEventType.Type04, false);
	            _.cale.toggleDatesType(c.WORKDAY, sap.me.CalendarEventType.Type06, false);
	            _.cale.toggleDatesType(c.WORKDAY, sap.me.CalendarEventType.Type07, false);
	            _.cale.toggleDatesType(c.WORKDAY, sap.me.CalendarEventType.Type10, true);
	        }
	    },
	    _getCaleEvtTypeForStatus: function (s) {
	        if (s === "WEEKEND") {
	            return sap.me.CalendarEventType.Type00;
	        } else if (s === "PHOLIDAY") {
	            return sap.me.CalendarEventType.Type06;
	        } else if (s === "SENT") {
	            return sap.me.CalendarEventType.Type04;
	        } else if (s === "POSTED" || s === "APPROVED") {
	            return sap.me.CalendarEventType.Type01;
	        } else if (s === "REJECTED") {
	            return sap.me.CalendarEventType.Type07;
	        } else if (s === "WORKDAY") {
	            if (sap.me.CalendarEventType.Type10)
	                return sap.me.CalendarEventType.Type10;
	            else
	                return "";
	        } else {
	            return "";
	        }
	    },
	    _getCalLabelsError: function (o) {
	        hcm.myleaverequest.utils.UIHelper.errorDialog(o);
	    },
	    _onChangeCurrentDate: function (e) {
	        if (this.cale) {
	            this._setHighlightedDays(this.cale.getCurrentDate());
	        }
	    },
	    _getStartEndDate: function (s) {
	        var _ = [];
	        var a = [];
	        var r = {};
	        for (var i = 0; i < s.length; i++) {
	            _[i] = new Date(s[i]);
	        }
	        if (_.length === 0) {
	            r.startDate = {};
	            r.endDate = {};
	        } else if (_.length === 1) {
	            r.startDate = _[0];
	            r.endDate = _[0];
	        } else {
	            a = _.sort(function (d, b) {
	                if (d < b)
	                    return -1;
	                if (d > b)
	                    return 1;
	                return 0;
	            });
	            r.startDate = a[0];
	            r.endDate = a[a.length - 1];
	        }
	        return r;
	    },
	    _getLeaveTypesFromModel: function () {
	        var _ = new Array();
	        for (var x in this.oDataModel.oData) {
	            if (x.substring(0, 21) === "AbsenceTypeCollection") {
	                if (this.oDataModel.oData[x] instanceof Array) {
	                    for (var i = 0; i < this.oDataModel.oData[x].length; i++) {
	                        _.push(this.oDataModel.oData[x][i]);
	                    }
	                } else {
	                    _.push(this.oDataModel.oData[x]);
	                }
	            }
	        }
	        return _;
	    },
	    _setUpLeaveTypeData: function (a) {
	        if (!a) {
	            this.leaveType = this._getDefaultAbsenceType(this.aLeaveTypes);
	            a = this.leaveType.AbsenceTypeCode;
	        } else {
	            this.leaveType = this._readWithKey(this.aLeaveTypes, a);
	        }
	        if (this.slctLvType) {
	            this.slctLvType.setSelectedKey(a);
	        }
	        this._leaveTypeDependantSettings(this.leaveType);
	        this.getBalancesForAbsenceType(a);
	        this.selectorInititDone = true;
	    },
	    _readWithKey: function (l, k) {
	        var d;
	        for (var i = 0; i < l.length; i++) {
	            if (l[i].AbsenceTypeCode === k) {
	                d = l[i];
	                return d;
	            }
	        }
	        if (l.length > 1) {
	            return l[0];
	        }
	    },
	    _getDefaultAbsenceType: function (l) {
	        var d;
	        for (var i = 0; i < l.length; i++) {
	            if (l[i].DefaultType === true) {
	                d = l[i];
	                return d;
	            }
	        }
	        if (!d) {
	            hcm.myleaverequest.utils.UIHelper.errorDialog(this.resourceBundle.getText("LR_DD_GENERIC_ERR"));
	            jQuery.sap.log.warning("couldn't find defaultLeaveType", "_getDefaultAbsenceType", "hcm.myleaverequest.view.S1");
	        }
	        if (l.length > 1) {
	            return l[0];
	        }
	    },
	    _getBalancesBusyOn: function () {
	        this.bookedVacation.setVisible(false);
	        this.byId("LRS1_BUSY_BOOKEDDAYS").setVisible(true);
	        this.remainingVacation.setVisible(false);
	        this.byId("LRS1_BUSY_REMAININGDAYS").setVisible(true);
	    },
	    _getBalancesBusyOff: function () {
	        this.bookedVacation.setVisible(true);
	        this.byId("LRS1_BUSY_BOOKEDDAYS").setVisible(false);
	        this.remainingVacation.setVisible(true);
	        this.byId("LRS1_BUSY_REMAININGDAYS").setVisible(false);
	    },
	    _leaveTypeDependantSettings: function (l) {
	        var c = hcm.myleaverequest.utils.DataManager.getCachedModelObjProp("DefaultConfigurations");
	        var C, C1;

	        if (l && l.AllowedDurationPartialDayInd) {
	            if (this.timeInputElem && this.byId("LRS4_FELEM_ABSENCE") && c) {
	                this.timeInputElem.setVisible(c.RecordInClockTimesAllowedInd);
	                this.byId("LRS4_FELEM_ABSENCE").setVisible(c.RecordInClockHoursAllowedInd);
	            }
	        } else {
	            if (this.timeInputElem && this.byId("LRS4_FELEM_ABSENCE")) {
	                this.timeInputElem.setVisible(false);
	                this.byId("LRS4_FELEM_ABSENCE").setVisible(false);
	            }
	        }
	        if (l) {
	            this.byId("LR_FELEM_APPROVER").setVisible(l.ApproverVisibleInd);
	            this.byId("LRS4_APPROVER_NAME").setEnabled(!l.ApproverReadOnlyInd);
	            if (this.changeMode && this.oChangeModeData.ApproverEmployeeID) {
	                C = new sap.ui.core.CustomData({
	                    "key": "ApproverEmployeeID",
	                    "value": this.oChangeModeData.ApproverEmployeeID
	                });
	                this.byId("LRS4_APPROVER_NAME").setValue(this.oChangeModeData.ApproverEmployeeName);
	            } else {
	                C = new sap.ui.core.CustomData({
	                    "key": "ApproverEmployeeID",
	                    "value": c.DefaultApproverEmployeeID
	                });
	                this.byId("LRS4_APPROVER_NAME").setValue(c.DefaultApproverEmployeeName);
	            }
	            this.byId("LRS4_APPROVER_NAME").removeAllCustomData();
	            this.byId("LRS4_APPROVER_NAME").addCustomData(C);

	            this.byId("LR_FELEM_STANDIN").setVisible(l.StandInVisibleInd);
	            this.byId("LRS4_STANDIN_NAME").setEnabled(!l.StandInReadOnlyInd);
	            if (this.changeMode && this.oChangeModeData.StandInEmployeeID) {
	                C1 = new sap.ui.core.CustomData({
	                    "key": "StandInEmployeeID",
	                    "value": this.oChangeModeData.StandInEmployeeID
	                });
	                this.byId("LRS4_STANDIN_NAME").setValue(this.oChangeModeData.StandInEmployeeName);
	            } else {
	                C1 = new sap.ui.core.CustomData({
	                    "key": "StandInEmployeeID",
	                    "value": c.DefaultStandInEmployeeID
	                });
	                this.byId("LRS4_STANDIN_NAME").setValue(c.DefaultStandInEmployeeName);
	            }
	            this.byId("LRS4_STANDIN_NAME").removeAllCustomData();
	            this.byId("LRS4_STANDIN_NAME").addCustomData(C1);	            
	            
	            this.byId("LRS4_FELEM_NOTE").setVisible(l.NoteVisibleInd);
	            this.byId("LRS4_FELEM_FILEATTACHMENTS").setVisible(l.AttachmentEnabled);
	            this.timeFrom.setValue("");
	            this.timeTo.setValue("");
	            this.byId("LRS4_ABS_HOURS").setValue("");
	            this.note.setValue("");
	            this.byId("fileUploader").setValue("");
	        }
	    },
	    _orientationDependancies: function (c) {
	        try {
	            if (sap.ui.Device.system.phone === true) {
	                if (this.cale) {
	                    this.cale.setMonthsToDisplay(1);
	                    this.cale.setMonthsPerRow(1);
	                }
	            } else {
	                if (c === "portrait") {
	                    if (this.byId("LRS4_FRM_CNT_CALENDAR") && this.byId("LRS4_FRM_CNT_CALENDAR").getLayoutData()) {
	                        this.byId("LRS4_FRM_CNT_CALENDAR").getLayoutData().setWeight(5);
	                    }
	                    if (this.cale) {
	                        this.cale.setMonthsToDisplay(1);
	                        this.cale.setMonthsPerRow(1);
	                    }
	                    if (this.formContainer && this.formContainer.getLayoutData()) {
	                        this.formContainer.getLayoutData().setWeight(5);
	                    }
	                } else if (c === "landscape" && this.byId("LRS4_FRM_CNT_CALENDAR").getLayoutData()) {
	                    if (this.byId("LRS4_FRM_CNT_CALENDAR")) {
	                        this.byId("LRS4_FRM_CNT_CALENDAR").getLayoutData().setWeight(6);
	                    }
	                    if (this.cale) {
	                        this.cale.setMonthsToDisplay(2);
	                        this.cale.setMonthsPerRow(2);
	                    }
	                    if (this.formContainer && this.formContainer.getLayoutData()) {
	                        this.formContainer.getLayoutData().setWeight(3);
	                    }
	                }
	            }
	        } catch (e) {
	            jQuery.sap.log.warning("Unable to set the orientation Dependancies:" + e.message, [], ["hcm.myleaverequest.view.S1.controller._orientationDependancies"]);
	        }
	    },
	    _deviceDependantLayout: function () {
	        try {
	            if (sap.ui.Device.system.phone) {
	                if (this.byId("LRS4_LEGEND")) {
	                    this.byId("LRS4_LEGEND").setExpandable(true);
	                    this.byId("LRS4_LEGEND").setExpanded(false);
	                }
	                if (this.timeInputElem) {
	                    this.timeInputElem.getLayoutData().setLinebreak(true);
	                }
	                if (this.formContainer) {
	                    this.formContainer.getLayoutData().setLinebreak(true);
	                    this.formContainer.getLayoutData().setWeight(3);
	                }
	            } else {
	                if (this.byId("S4")) {
	                    this.byId("S4").setEnableScrolling(false);
	                }
	                if (this.byId("LRS4_FRM_CNT_CALENDAR")) {
	                    this.byId("LRS4_FRM_CNT_CALENDAR").getLayoutData().setWeight(6);
	                }
	                if (this.cale) {
	                    this.cale.setMonthsToDisplay(2);
	                    this.cale.setMonthsPerRow(2);
	                }
	                if (this.formContainer) {
	                    this.formContainer.getLayoutData().setLinebreak(false);
	                    this.formContainer.getLayoutData().setWeight(3);
	                }
	                if (this.balanceElem) {
	                    this.balanceElem.getLayoutData().setLinebreak(false);
	                }
	                if (this.timeInputElem) {
	                    this.timeInputElem.getLayoutData().setLinebreak(true);
	                    this.timeInputElem.setVisible(false);
	                }
	                if (this.noteElem) {
	                    this.noteElem.getLayoutData().setLinebreak(true);
	                }
	                if (this.byId("LRS4_LEGEND")) {
	                    this.byId("LRS4_LEGEND").setExpandable(true);
	                    this.byId("LRS4_LEGEND").setExpanded(true);
	                }
	                if (this.byId("LRS4_FRM_CNT_LEGEND")) {
	                    this.byId("LRS4_FRM_CNT_LEGEND").getLayoutData().setLinebreak(true);
	                    this.byId("LRS4_FRM_CNT_LEGEND").getLayoutData().setWeight(9);
	                }
	            }
	            if (this.extHookDeviceDependantLayout) {
	                this.extHookDeviceDependantLayout();
	            }
	        } catch (e) {
	            jQuery.sap.log.warning("Unable to set the device Dependancies:" + e.message, [], ["hcm.myleaverequest.view.S1.controller._deviceDependantLayout"]);
	        }
	    },
	    _getDaysOfRange: function (s, e) {
	        var _ = null;
	        var a = null;
	        var d = [];
	        if (s instanceof Date) {
	            _ = new Date(s.getUTCFullYear(), s.getUTCMonth(), s.getUTCDate());
	        } else if (typeof s === "string") {
	            _ = new Date(s);
	        }
	        if (e instanceof Date) {
	            a = new Date(e.getUTCFullYear(), e.getUTCMonth(), e.getUTCDate());
	        } else if (typeof e === "string") {
	            a = new Date(e);
	        }
	        if (a === null) {
	            _ = new Date(_);
	            return [_.toDateString()];
	        } else {
	            while (_ <= a) {
	                d.push(_.toDateString());
	                _.setTime(_.getTime() + 86400000);
	            }
	            return d;
	        }
	    },
	    onSend: function () {
	        this.submit(true);
	    },
	    submit: function (i) {
	        var s, S, E, a;
	        this.bApproverOK = null;
	        this.bSubmitOK = null;
	        this.oSubmitResult = {};
	        this.bSimulation = i;
	        if (this.cale) {
	            var _ = this._getStartEndDate(this.cale.getSelectedDates());
	            if (this.timeFrom && this.timeTo && this.leaveType.AllowedDurationPartialDayInd) {
	                s = hcm.myleaverequest.utils.Formatters.DATE_YYYYMMdd(_.startDate) + "T00:00:00";
	                if (this.timeFrom.getValue() === "") {
	                    S = "000000";
	                } else {
	                    S = this.timeFrom.getValue().substring(0, 2) + this.timeFrom.getValue().substring(3, 5) + "00";
	                }
	                E = hcm.myleaverequest.utils.Formatters.DATE_YYYYMMdd(_.endDate) + "T00:00:00";
	                if (this.timeTo.getValue() === "") {
	                    a = "000000";
	                } else {
	                    a = this.timeTo.getValue().substring(0, 2) + this.timeTo.getValue().substring(3, 5) + "00";
	                }
	            } else {
	                s = hcm.myleaverequest.utils.Formatters.DATE_YYYYMMdd(_.startDate) + "T00:00:00";
	                S = "000000";
	                E = hcm.myleaverequest.utils.Formatters.DATE_YYYYMMdd(_.endDate) + "T00:00:00";
	                a = "000000";
	            }
	            if (!this.oBusy) {
	                this.oBusy = new sap.m.BusyDialog();
	            }
	            this.oBusy.open();
	            var n = "";
	            if (this.note) {
	                n = this.note.getValue();
	            }
	            var N = {};
	            N.StartDate = s;
	            N.StartTime = S;
	            N.Notes = n;
	            N.ProcessCheckOnlyInd = i ? true : false;
	            N.AbsenceTypeCode = this.leaveType.AbsenceTypeCode;
	            N.EndDate = E;
	            N.EndTime = a;
	            N.InfoType = this.leaveType.InfoType;
	            if (this.byId("LRS4_ABS_HOURS").getValue()) {
	                N.WorkingHoursDuration = this.byId("LRS4_ABS_HOURS").getValue();
	            }
	            if (this.byId("LRS4_APPROVER_NAME").getValue()) {
	                N.ApproverEmployeeName = this.byId("LRS4_APPROVER_NAME").getValue();
	            }
	            try {
	                N.ApproverEmployeeID = this.byId("LRS4_APPROVER_NAME").getCustomData()[0].getValue();
	            } catch (e) {
	                N.ApproverEmployeeID = "";
	            }
				if (this.byId("LRS4_STANDIN_NAME").getValue()) {
	                N.StandInEmployeeName = this.byId("LRS4_STANDIN_NAME").getValue();
	            }
	            try {
	                N.StandInEmployeeID = this.byId("LRS4_STANDIN_NAME").getCustomData()[0].getValue();
	            } catch (e) {
	                N.StandInEmployeeID = "";
	            }	            
	            if (this.changeMode) {
	                N.RequestID = this.oChangeModeData.requestID;
	                N.EmployeeID = hcm.myleaverequest.utils.UIHelper.getPernr();
	                N.ChangeStateID = this.oChangeModeData.changeStateID;
	                N.ActionCode = 2;
	                N.LeaveKey = this.oChangeModeData.leaveKey;
	                N.EmployeeID = hcm.myleaverequest.utils.UIHelper.getPernr();
	                hcm.myleaverequest.utils.DataManager.changeLeaveRequest(N, i, this.onSubmitLRCsuccess, this.onSubmitLRCfail, this.uploadFileAttachments);
	            } else {
	                N.RequestID = "";
	                N.EmployeeID = hcm.myleaverequest.utils.UIHelper.getPernr();
	                N.ActionCode = 1;
	                hcm.myleaverequest.utils.DataManager.submitLeaveRequest(N, i, this.onSubmitLRCsuccess, this.onSubmitLRCfail, this.uploadFileAttachments);
	            }
	        }
	        if (this.extHookSubmit) {
	            this.extHookSubmit();
	        }
	    },
	    onSubmitLRCfail: function (e) {
	        var _ = hcm.myleaverequest.utils.UIHelper.getControllerInstance();
	        _.evalSubmitResult("submitLRC", false, {});
	        _.oBusy.close();
	        if (this.extHookOnSubmitLRCfail) {
	            e = this.extHookOnSubmitLRCfail(e);
	        }
	        hcm.myleaverequest.utils.UIHelper.errorDialog(e);
	    },
	    onSubmitLRCsuccess: function (r, m) {
	        var _ = hcm.myleaverequest.utils.UIHelper.getControllerInstance();
	        if (this.extHookOnSubmitLRCsuccess) {
	            var e = this.extHookOnSubmitLRCsuccess(r, m);
	            r = e.oResult;
	            m = e.oMsgHeader;
	        }
	        _.oLRSuccessResult = r;
	        if (_.bSimulation) {
	            if (m && m.severity) {
	                if (m.severity === "warning") {
	                    if (typeof String.prototype.trim !== "function") {
	                        String.prototype.trim = function () {
	                            return this.replace(/^\s+|\s+$/g, "");
	                        };
	                    }
	                    var d = "";
	                    m.details.forEach(function (l) {
	                        d += decodeURI(l.message).trim() + "\r\n";
	                    });
	                    sap.ca.ui.message.showMessageBox({
	                        type: sap.ca.ui.message.Type.WARNING,
	                        message: decodeURI(m.message).trim(),
	                        details: d
	                    }, _._fetchApprover(r));
	                } else {
	                    _._fetchApprover(r);
	                }
	            } else {
	                _._fetchApprover(r);
	            }
	        } else {
	            if (_.cale && _.changeMode) {
	                var D = _._getDaysOfRange(_.oChangeModeData.startDate, _.oChangeModeData.endDate);
	                _.cale.toggleDatesType(D, _.oChangeModeData.evtType, false);
	                _._deleteOldDatesFromCalendarCache(D, _.oChangeModeData.StatusCode);
	                var s = hcm.myleaverequest.utils.Formatters.getDate(_.oLRSuccessResult.StartDate);
	                var a = hcm.myleaverequest.utils.Formatters.getDate(_.oLRSuccessResult.EndDate);
	                s = new Date(s.getUTCFullYear(), s.getUTCMonth(), s.getUTCDate(), 0, 0, 0);
	                a = new Date(a.getUTCFullYear(), a.getUTCMonth(), a.getUTCDate(), 0, 0, 0);
	                _.oChangeModeData.requestId = _.oLRSuccessResult.RequestID;
	                _.oChangeModeData.leaveTypeCode = _.oLRSuccessResult.AbsenceTypeCode;
	                _.oChangeModeData.startDate = s.toString();
	                _.oChangeModeData.endDate = a.toString();
	                _.oChangeModeData.requestID = _.oLRSuccessResult.RequestID;
	                _.oChangeModeData.noteTxt = _.oLRSuccessResult.Notes;
	                _.oChangeModeData.startTime = _.oLRSuccessResult.StartTime;
	                _.oChangeModeData.endTime = _.oLRSuccessResult.EndTime;
	                _.oChangeModeData.employeeID = _.oLRSuccessResult.EmployeeID;
	                _.oChangeModeData.changeStateID = _.oLRSuccessResult.ChangeStateID;
	                _.oChangeModeData.leaveKey = _.oLRSuccessResult.LeaveKey;
	                _.oChangeModeData.evtType = _._getCaleEvtTypeForStatus(_.oLRSuccessResult.StatusCode);
	                _.oChangeModeData.StatusCode = _.oLRSuccessResult.StatusCode;
	                _.oChangeModeData.ApproverEmployeeID = _.oLRSuccessResult.ApproverEmployeeID;
	                _.oChangeModeData.ApproverEmployeeName = _.oLRSuccessResult.ApproverEmployeeName;
					_.oChangeModeData.StandInEmployeeID = _.oLRSuccessResult.StandInEmployeeID;
	                _.oChangeModeData.StandInEmployeeName = _.oLRSuccessResult.StandInEmployeeName;	                
	                _.oChangeModeData.WorkingHoursDuration = _.oLRSuccessResult.WorkingHoursDuration;
	                _.oChangeModeData.AttachmentDetails = _.oLRSuccessResult.AttachmentDetails;
	            }
	            sap.m.MessageToast.show(_.resourceBundle.getText("LR_SUBMITDONE", [_.sApprover]), { width: "15em" });
	            _._clearData();
	            _._setUpLeaveTypeData(_.slctLvType.getSelectedKey());
	            _.note.setValue("");
	            if (_.cale) {
	                var b = _.cale.getSelectedDates();
	                var c = _._getDaysOfRange(_.oLRSuccessResult.StartDate, _.oLRSuccessResult.EndDate);
	                if (!c) {
	                    c = _._getDaysOfRange(b[0], b[b.length - 1]);
	                }
	                for (var i = 0; i < c.length; i++) {
	                    var f = new Date(c[i]);
	                    var g = new Date(f.getFullYear(), f.getMonth(), 1);
	                    var C = hcm.myleaverequest.utils.CalendarTools.oCache;
	                    if (C.hasOwnProperty(g.toString())) {
	                        var h = C[g];
	                        for (var k in h) {
	                            if (h.hasOwnProperty(k)) {
	                                if (h[k].length > 0) {
	                                    for (var j = 0; j < h[k].length; j++) {
	                                        if (new Date(h[k][j]).toString() == new Date(f).toString()) {
	                                            h[k].splice(j, 1);
	                                            if (h[k].length < 1) {
	                                                delete h[k];
	                                            }
	                                            break;
	                                        }
	                                    }
	                                }
	                            }
	                        }
	                        if (_.oLRSuccessResult.StatusCode === "APPROVED") {
	                            if (h.hasOwnProperty("APPROVED"))
	                                h.APPROVED.push(c[i]);
	                            else {
	                                h.APPROVED = new Array(c[i]);
	                            }
	                        } else {
	                            if (h.hasOwnProperty("SENT"))
	                                h.SENT.push(c[i]);
	                            else {
	                                h.SENT = new Array(c[i]);
	                            }
	                        }
	                    }
	                }
	                _.cale.toggleDatesType(c, sap.me.CalendarEventType.Type06, false);
	                _.cale.toggleDatesType(c, sap.me.CalendarEventType.Type01, false);
	                _.cale.toggleDatesType(c, sap.me.CalendarEventType.Type07, false);
	                _.cale.toggleDatesType(c, sap.me.CalendarEventType.Type04, false);
	                if (sap.me.CalendarEventType.Type10) {
	                    _.cale.toggleDatesType(c, sap.me.CalendarEventType.Type10, false);
	                }
	                if (_.oLRSuccessResult.StatusCode === "APPROVED" || _.oLRSuccessResult.StatusCode === "POSTED") {
	                    _.cale.toggleDatesType(c, sap.me.CalendarEventType.Type01, true);
	                } else {
	                    _.cale.toggleDatesType(c, sap.me.CalendarEventType.Type04, true);
	                }
	            }
	        }
	        _.oBusy.close();
	    },
	    _fetchApprover: function (l) {
	        var _ = hcm.myleaverequest.utils.UIHelper.getControllerInstance();
	        var a = {};
	        if (l.ApproverEmployeeName !== "") {
	            _.slctLvType.setSelectedKey(_.leaveType.AbsenceTypeCode);
	            a.sApprover = _.sApprover = l.ApproverEmployeeName;
	            _.evalSubmitResult("getApprover", true, a);
	            _.evalSubmitResult("submitLRC", true, _.oLRSuccessResult);
	        } else {
	            hcm.myleaverequest.utils.DataManager.getApprover(function (A) {
	                _.slctLvType.setSelectedKey(_.leaveType.AbsenceTypeCode);
	                a.sApprover = _.sApprover = A;
	                _.evalSubmitResult("getApprover", true, a);
	                _.evalSubmitResult("submitLRC", true, _.oLRSuccessResult);
	            }, function () {
	                a.sApprover = _.resourceBundle.getText("LR_UNKNOWN");
	                _.evalSubmitResult("getApprover", false, a);
	            }, this);
	        }
	    },
	    evalSubmitResult: function (c, s, r) {
	        var _ = hcm.myleaverequest.utils.UIHelper.getControllerInstance();
	        if (c === "submitLRC") {
	            _.bSubmitOK = s;
	            _.oSubmitResult = r;
	        }
	        if (c === "getApprover") {
	            _.bApproverOK = s;
	            _.sApprover = r.sApprover;
	        }
	        if (_.bSubmitOK === false) {
	            if (_.oBusy) {
	                _.oBusy.close();
	            }
	        } else if (_.bSubmitOK === true) {
	            if (_.bApproverOK === false) {
	                if (_.oBusy) {
	                    _.oBusy.close();
	                }
	                _.callDialog(_.oSubmitResult, _.sApprover);
	            } else if (_.bApproverOK === true) {
	                if (_.oBusy) {
	                    _.oBusy.close();
	                }
	                _.callDialog(_.oSubmitResult, _.sApprover);
	            }
	        }
	    },
	    callDialog: function (s, a) {
	        var _ = hcm.myleaverequest.utils.UIHelper.getControllerInstance();
	        var b, c;
	        if (jQuery.sap.getUriParameters().get("responderOn")) {
	            if (_.selRange.start === null) {
	                try {
	                    _.selRange.start = sap.me.Calendar.parseDate(_.cale.getSelectedDates()[0]);
	                } catch (e) {
	                    _.selRange.start = new Date(_.cale.getSelectedDates()[0]);
	                }
	            }
	            b = _.selRange.start;
	            if (_.selRange.end === null) {
	                c = _.selRange.start;
	            } else {
	                c = _.selRange.end;
	            }
	        } else {
	            if (_.leaveType.AllowedDurationPartialDayInd) {
	                b = hcm.myleaverequest.utils.Formatters.DATE_ODATA_EEEdMMMyyyy(s.StartDate, "medium");
	                c = hcm.myleaverequest.utils.Formatters.DATE_ODATA_EEEdMMMyyyy(s.EndDate, "medium");
	                b += " " + hcm.myleaverequest.utils.Formatters.TIME_hhmm(s.StartTime);
	                c += " " + hcm.myleaverequest.utils.Formatters.TIME_hhmm(s.EndTime);
	            } else {
	                b = hcm.myleaverequest.utils.Formatters.DATE_ODATA_EEEdMMMyyyy(s.StartDate);
	                c = hcm.myleaverequest.utils.Formatters.DATE_ODATA_EEEdMMMyyyy(s.EndDate);
	            }
	        }
	        var S = {
	            question: this.resourceBundle.getText("LR_CONFIRMATIONMSG", [a]),
	            additionalInformation: [
	                {
	                    label: _.resourceBundle.getText("LR_BALANCE_DEDUCTIBLE"),
	                    text: this.leaveType.AbsenceTypeName
	                },
	                {
	                    label: _.resourceBundle.getText("LR_FROM"),
	                    text: b
	                },
	                {
	                    label: _.resourceBundle.getText("LR_TO"),
	                    text: c
	                },
	                {
	                    label: _.resourceBundle.getText("LR_REQUEST"),
	                    text: hcm.myleaverequest.utils.Formatters.adjustSeparator(s.WorkingHoursDuration) + " " + _.resourceBundle.getText("LR_LOWERCASE_HOURS")
	                }
	            ],
	            showNote: false,
	            title: _.resourceBundle.getText("LR_TITLE_SEND"),
	            confirmButtonLabel: _.resourceBundle.getText("LR_OK")
	        };
	        if (!a || a === null || a === undefined) {
	            delete S.question;
	        }
	        if (this.extHookCallDialog) {
	            S = this.extHookCallDialog(S);
	        }
	        sap.ca.ui.dialog.factory.confirm(S, function (r) {
	            if (r.isConfirmed === true) {
	                _.submit(false);
	            }
	        });
	    },
	    onSelectionChange: function (e) {
	        var s = e.getParameter("selectedItem");
	        var a = s.getProperty("key");
	        this._setUpLeaveTypeData(a);
	    },
	    getBalancesForAbsenceType: function (a) {
	        if (!a) {
	            return;
	        }
	        this._getBalancesBusyOn();
	        var _ = this;
	        hcm.myleaverequest.utils.DataManager.getBalancesForAbsenceType(a, function (b, t, B, T, s, c, d, e) {
	            _.balanceElem.setVisible(e);
	            _._getBalancesBusyOff();
	            if (e) {
	                var j = {
	                    BalancePlannedQuantity: b,
	                    BalanceAvailableQuantity: B,
	                    BalanceUsedQuantity: c,
	                    BalanceTotalUsedQuantity: d,
	                    TimeUnitName: T
	                };
	                var m = new sap.ui.model.json.JSONModel(j);
	                _.getView().setModel(m, "TimeAccount");
	                m.createBindingContext("/", function (C) {
	                    _.getView().setBindingContext(C, "TimeAccount");
	                });
	            }
	        }, function (e) {
	            _._getBalancesBusyOff();
	            hcm.myleaverequest.utils.UIHelper.errorDialog(e);
	        }, this);
	    },
	    onTimeChange: function () {
	        var _ = this.byId("LRS4_DAT_ENDTIME").getValue();
	        var a = this.byId("LRS4_DAT_STARTTIME").getValue();
	        if (this.byId("LRS4_DAT_ENDTIME") && _ === "" && a !== "") {
	            this.byId("LRS4_DAT_ENDTIME").setValue(a);
	        }
	        if (this.byId("LRS4_DAT_STARTTIME") && _ !== "" && a === "") {
	            this.byId("LRS4_DAT_STARTTIME").setValue(_);
	        }
	    },
	    onSendClick: function () {
	        this.submit(true);
	    },
	    onCancelClick: function () {
	        if (!this.changeMode) {
	            this._isLocalReset = true;
	            this._clearData();
	            hcm.myleaverequest.utils.CalendarTools.clearCache();
	            this._setHighlightedDays(this.cale.getCurrentDate());
	        } else {
	            this.oRouter.navTo("master");
	        }
	    },
	    onEntitlementClick: function () {
	        this.oRouter.navTo("entitlements", {});
	    },
	    onHistoryClick: function () {
	        this.oRouter.navTo("master", {});
	    },
	    handleApproverValueHelp: function () {
	        var _ = this;
	        var D = _.resourceBundle.getText("LR_APPROVER");
	        var s = new sap.m.SelectDialog({
	            title: D,
	            search: _._approverSearchAction
	        });
	        s.open();
	    },
	    _approverSearchAction: function (e) {
	        var _ = this;
	        if (e.getParameter("value").length > 0 || !isNaN(e.getParameter("value"))) {
	            sap.ca.ui.utils.busydialog.requireBusyDialog();
	            var s = function (d) {
	                for (var i = 0; i < d.results.length; i++) {
	                    if (d.results[i].ApproverEmployeeID === "00000000") {
	                        delete d.results[i];
	                    }
	                }
	                var m = new sap.ui.model.json.JSONModel(d);
	                sap.ca.ui.utils.busydialog.releaseBusyDialog();
	                var a = new sap.m.StandardListItem({
	                    title: "{ApproverEmployeeName}",
	                    description: "{ApproverEmployeeID}",
	                    active: "true"
	                });
	                _.setModel(m);
	                _.bindAggregation("items", "/results", a);
	                _.attachConfirm(function (e) {
	                    var _ = hcm.myleaverequest.utils.UIHelper.getControllerInstance();
	                    var b = e.getParameter("selectedItem");
	                    var c = new sap.ui.core.CustomData({
	                        "key": "ApproverEmployeeID",
	                        "value": b.getDescription()
	                    });
	                    _.byId("LRS4_APPROVER_NAME").removeAllCustomData();
	                    _.byId("LRS4_APPROVER_NAME").addCustomData(c);
	                    _.byId("LRS4_APPROVER_NAME").setValue(b.getTitle());
	                });
	            };
	            hcm.myleaverequest.utils.DataManager.searchApprover(e.getParameter("value"), s);
	        }
	    },
		handleStandInValueHelp: function () {
	        var _ = this;
	        var D = _.resourceBundle.getText("LR_STANDIN");
	        var s = new sap.m.SelectDialog({
	            title: D,
	            search: _._standInSearchAction
	        });
	        s.open();
	    },
	    _standInSearchAction: function (e) {
	    	var _ = this;
	        if (e.getParameter("value").length > 0 || !isNaN(e.getParameter("value"))) {
	            sap.ca.ui.utils.busydialog.requireBusyDialog();
	            var s = function (d) {
	                for (var i = 0; i < d.results.length; i++) {
	                	if (d.results[i].StandInEmployeeID === "00000000") {
	                    //if (d.results[i].ApproverEmployeeID === "00000000") {
	                        delete d.results[i];
	                    }
	                }
	                var m = new sap.ui.model.json.JSONModel(d);
	                sap.ca.ui.utils.busydialog.releaseBusyDialog();
	                var a = new sap.m.StandardListItem({
	                    title: "{StandInEmployeeName}",
	                    description: "{StandInEmployeeID}",
						//title: "{ApproverEmployeeName}",
	                    //description: "{ApproverEmployeeID}",	                    
	                    active: "true"
	                });
	                _.setModel(m);
	                _.bindAggregation("items", "/results", a);
	                _ .attachConfirm(function (e1) {
	                    var __ = hcm.myleaverequest.utils.UIHelper.getControllerInstance();
	                    var b = e1.getParameter("selectedItem");
	                    var c = new sap.ui.core.CustomData({
	                    	"key": "StandInEmployeeID",
	                        //"key": "ApproverEmployeeID",
	                        "value": b.getDescription()
	                    });
	                    __.byId("LRS4_STANDIN_NAME").removeAllCustomData();
	                    __.byId("LRS4_STANDIN_NAME").addCustomData(c);
	                    __.byId("LRS4_STANDIN_NAME").setValue(b.getTitle());
	                });
	            };
	            hcm.myleaverequest.utils.DataManager.searchStandIn(e.getParameter("value"), s);
	            //hcm.myleaverequest.utils.DataManager.searchApprover(e.getParameter("value"), s);
	        }
	    },	    
	    uploadFileAttachments: function (s, o, a) {
	        var _ = hcm.myleaverequest.utils.UIHelper.getControllerInstance();
	        _.objectResponse = o;
	        var f = _.byId("fileUploader");
	        _.ResponseMessage = a;
	        if (!_.bSimulation && _.leaveType.AttachmentEnabled && f.getValue()) {
	            var u = "/LeaveRequestCollection(EmployeeID='',RequestID='" + o.RequestID + "',ChangeStateID=1,LeaveKey='')/LeaveRequestFileAttachment";
	            u = _.oDataModel.sServiceUrl + u;
	            f.setUploadUrl(u);
	            f.removeAllHeaderParameters();
	            f.addHeaderParameter(new sap.ui.unified.FileUploaderParameter({
	                name: "slug",
	                value: f.getValue()
	            }));
	            f.addHeaderParameter(new sap.ui.unified.FileUploaderParameter({
	                name: "x-csrf-token",
	                value: _.oDataModel.getSecurityToken()
	            }));
	            f.setSendXHR(true);
	            if (f.getValue()) {
	                f.upload();
	            }
	        } else {
	            _.onSubmitLRCsuccess(_.objectResponse, _.ResponseMessage);
	        }
	    },
	    handleUploadComplete: function (c) {
	        var _ = hcm.myleaverequest.utils.UIHelper.getControllerInstance();
	        var p = c.getParameters();
	        if (parseInt(p.status, 10) >= 400) {
	            var X = jQuery.parseXML(p.responseRaw);
	            var e = hcm.myleaverequest.utils.DataManager.Xml2Json(X.documentElement);
	            var s = {
	                message: e.message,
	                type: sap.ca.ui.message.Type.ERROR
	            };
	            sap.ca.ui.message.showMessageBox(s);
	        }
	        this.onSubmitLRCsuccess(_.objectResponse, _.ResponseMessage);
	    },
	    handleValueChange: function () {
	        jQuery.sap.log.info("fileUploaderValue changed", ["handleValueChange"], ["S1 controller"]);
	    },
	    _deleteOldDatesFromCalendarCache: function (d, s) {
	        try {
	            for (var i = 0; i < d.length; i++) {
	                var c = new Date(d[i]);
	                var f = new Date(c.getFullYear(), c.getMonth(), 1);
	                var C = hcm.myleaverequest.utils.CalendarTools.oCache;
	                if (C.hasOwnProperty(f.toString())) {
	                    var a = C[f];
	                    for (var k in a) {
	                        if (k === s && a.hasOwnProperty(k)) {
	                            if (a[k].length > 0) {
	                                for (var j = 0; j < a[k].length; j++) {
	                                    if (new Date(a[k][j]).toString() == new Date(c).toString()) {
	                                        a[k].splice(j, 1);
	                                        if (a[k].length < 1) {
	                                            delete a[k];
	                                        }
	                                        break;
	                                    }
	                                }
	                            }
	                        }
	                    }
	                }
	            }
	        } catch (e) {
	            jQuery.sap.log.warning("falied to update cache" + e, "_deleteOldDatesFromCalendarCache", "hcm.myleaverequest.view.S1");
	        }
	    },
	    initializeView: function () {
	        var _ = this;
	        var c = $.when(hcm.myleaverequest.utils.DataManager.getConfiguration(), hcm.myleaverequest.utils.DataManager.getAbsenceTypeCollection());
	        c.done(function (d, l) {
	            _.aLeaveTypes = l;
	            var o = {};
	            o.AbsenceTypeCollection = _.aLeaveTypes;
	            _.slctLvType.setModel(new sap.ui.model.json.JSONModel(o));
	            _.slctLvType.bindItems({
	                path: "/AbsenceTypeCollection",
	                template: new sap.ui.core.Item({
	                    key: "{AbsenceTypeCode}",
	                    text: "{AbsenceTypeName}"
	                })
	            });
	            if (_.aLeaveTypes.length > 0) {
	                _._setUpLeaveTypeData();
	            }
	        });
	        c.fail(function (e) {
	            hcm.myleaverequest.utils.UIHelper.errorDialog(e);
	        });
	        _._setHighlightedDays(_.cale.getCurrentDate());
	    }
});