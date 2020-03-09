var DemoWebSiteBootstrap = typeof DemoWebSiteBootstrap !== "undefined" ? DemoWebSiteBootstrap : (function($) {
	var app, prd, cli, ord, ctc;
	var $loading, $main, $info, $warning, $error, $popup;
	
	var page;
	
	function info(msg) { $info.html(msg).slideDown(); }
	function warning(msg) { $warning.html(msg).slideDown(); }
	function error(err) { $error.html(app.getErrorMessage(err)).slideDown(); }
	
	function amount(v) { return parseFloat(v).toFixed(2) + " &euro;"; }
	function date(d) { return new Date(Date.parse(d)).toDateString(); }

	function init(loading) {
		$loading = $("<img/>", { src: loading });
		
		$("#menu-brand").click(function() { catalog(); });
		$("#menu-catalog").click(function() { catalog(); });
		$("#menu-orders").click(function() { orders(); });
		$("#menu-messages").click(function() { messages(); });
		$("#menu-agenda").click(function() { agenda(); });
		$("#menu-news").click(function() { news(); });
		
		$main = $("#main").html($loading);
		$info = $("#info");
		$warning = $("#warning");
		$error = $("#error");
		
		var t = $("<h4/>").addClass("modal_title");
		var b = $("<div/>").addClass("modal-body");
		var ok = $("<button/>", { type: "button" }).addClass("btn").addClass("btn-primary").attr("data-dismiss", "modal").attr("aria-hidden", true).append("OK");
		var p = $("<div/>").addClass("modal").addClass("fade").attr("tabindex", -1).attr("role", "dialog").attr("aria-hidden", true).append(
			$("<div/>").addClass("modal-dialog").append(
				$("<div/>").addClass("modal-content").append(
					$("<div/>").addClass("modal-header").append(
						$("<button/>", { type: "button" }).addClass("close").attr("data-dismiss", "modal").attr("aria-hidden", true).append("&times;")
					).append(t)
				).append(b).append(
					$("<div/>").addClass("modal-footer").append(
						$("<button/>", { type: "button" }).addClass("btn").addClass("btn-default").attr("data-dismiss", "modal").attr("aria-hidden", true).append("Close")
					).append(ok)
				)
			)
		);
		$("body").append(p);
		$popup = { title: t, body: b, ok: ok, show: function() { p.modal("show"); }, hide: function() { p.modal("hide"); } };

		// Using current authenticated user thru UI gateway
		//app = new Simplicite.Ajax(ROOT);
		// Using public user thru public UI gateway
		//app = new Simplicite.Ajax(ROOT, "uipublic");
		// Using website user thru API gateway (website user has default password, change it here if you change it at user level)
		app = new Simplicite.Ajax(ROOT, "api", "website", "simplicite");

		app.setInfoHandler(info);
		app.setWarningHandler(warning);
		app.setErrorHandler(error);
		//app.setDebugHandlerActive(true);
		//app.setTimeout(5000);
		
		session();
	}
	
	function session() {
		var token = localStorage ? localStorage.getItem("authtoken") : undefined;
		if (token) console.log("Try to reuse auth token: " + token);
		app.session(function(s) {
			console.log("Got auth token: " + s.authtoken + " in session: " + s.id);
			if (localStorage) localStorage.setItem("authtoken", s.authtoken);
			prd = app.getBusinessObject("DemoProduct");
			cli = app.getBusinessObject("DemoClient");
			cli.item = undefined;
			ord = app.getBusinessObject("DemoOrder");
			ctc = app.getBusinessObject("DemoContact");
			ord.getMetaData(function() {
				client();
				catalog();
			});
			ctc.getMetaData();
		}, function(e) {
			$main.empty();
			if (localStorage) localStorage.removeItem("authtoken");
			if (token) {
				console.log("Auth token: " + token + " is not valid, try again without token");
				session();
			} else error(e);
		}, token);
	}

	function reset(loading) {
		if (loading)
			$main.html($loading);
		$info.hide().empty();
		$warning.hide().empty();
		$error.hide().empty();
	}

	function contact(orderItem) {
		$popup.title.empty().append("Contact" + (orderItem === undefined ? "" : " on order " + orderItem.demoOrdNumber));
		$popup.body.empty().append($("<div/>").append("Your message:")).append($("<textarea/>", { id: "message", style: "width: 100%; height: 200px;" }));
		$popup.ok.click(function() {
			ctc.getForCreate(function() {
				ctc.item.demoCtcCliId = cli.item.row_id;
				ctc.item.demoCtcType = "INF";
				ctc.item.demoCtcCanal = "WEB";
				ctc.item.demoCtcComments = "<p>Message from the customer:<blockquote>" + $("#message").val() + "</blockquote></p>&nbsp;";
				if (orderItem !== undefined)
					ctc.item.demoCtcOrdId = orderItem.row_id;
	
				ctc.create(function() {
					$popup.hide();
					info("Your message has been sent !");
				});
			});
		});
		$popup.show();
	}

	function client() {
		$("#header").empty().append(row().append($("<div/>").addClass("col-md-4").append(input("demoCliCode", "", "Enter your customer code", function(cc) {
			reset(false);
			cli.search(function() {
				if (cli.list.length == 1) {
					cli.item = cli.list[0];
					$("#header").empty()
							.append("You are connected as <strong>" + cli.item.demoCliFirstname + " " + cli.item.demoCliLastname + "</strong>").append("&nbsp;&nbsp;")
							.append($("<button/>").addClass("btn").addClass("btn-primary").addClass("btn-xs").text("Message").click(function() { contact(); }))
							.append("&nbsp;&nbsp;")
							.append($("<button/>").addClass("btn").addClass("btn-danger").addClass("btn-xs").text("Quit").click(function() {
								cli.item = undefined;
								if (page != "news") catalog();
								client();
							}));
					if (page === "order")
						$("#button-order").attr("disabled", false);
					else if (page === "orders")
						orders();
					else if (page === "messages")
						messages();
					else if (page === "agenda")
						agenda();
				} else {
					error("Unknown customer code: " + cc.val());
					cc.select().focus();
				}
			}, { demoCliCode: cc.val().toUpperCase() });
		})))).fadeIn();
		$("#demoCliCode").focus();
	}
	
	function row() {
		return $("<div/>").addClass("row");
	}
	
	function panel(body, heading, style, span) {
		var p = $("<div/>").addClass("panel").addClass("panel-" + (style === undefined ? "default" : style));
		if (heading !== undefined)
			p.append($("<div/>").addClass("panel-heading").append($("<h3/>").addClass("panel-title").append(heading)));
		if (body.is("table"))
			return p.append(body);
		else
			p.append($("<div/>").addClass("panel-body").append(body));
		if (span !== undefined)
			return $("<div/>").addClass("col-md-" + span).append(p);
		return p;
	}

	function catalog() {
		function order_click() {
			prd.item = $(this).data("item");
			order();
		}
		reset(true);
		page = "catalog";
		prd.search(function() {
			$main.empty();
			var r;
			for (var i = 0; i < prd.list.length; i++) {
				var item = prd.list[i];
				if (i % 4 === 0) {
					if (r !== undefined) $main.append(r);
					r = row();
				}
				var pt = item.demoPrdSupId__demoSupName + " / " + item.demoPrdName;
				//var pi = $("<img/>", { style: "height: 200px;", title: item.demoPrdReference, src: "data:" + item.demoPrdPicture.mime + ";base64," + item.demoPrdPicture.content }).popover({ content: item.demoPrdDescription });
				var pi = $("<img/>", { style: "height: 150px;", title: item.demoPrdReference, src: app.imageURL(prd.getName(), "demoPrdPicture", item.row_id, item.demoPrdPicture, false) }).popover({ content: item.demoPrdDescription });
				var pp = $("<strong/>", { style: "margin-right: 25px;" }).append(amount(item.demoPrdUnitPrice));
				var b = $("<button/>").addClass("btn").addClass("btn-success").text("Order").data("item", item).click(order_click);
				r.append(panel($("<div/>").addClass("text-center").append(pi).append("<hr/>").append($("<p/>").addClass("text-right").append(pp).append(b)), pt, "default", 3));
			}
			if (r !== undefined) $main.append(r);
		}/*, undefined, /*{ inlineDocs: true }*/);
	}
	
	function formElement(id, label, content) {
		var fg =$("<div/>").addClass("form-group");
		fg.append($("<label/>").attr("for", id).addClass("col-md-3").addClass("control-label").append(label === undefined ? "" : label));
		fg.append($("<div/>").addClass("col-md-9").append(content));
		return fg;
	}
	
	function input(id, value, placeholder, change) {
		var i = $("<input/>", { id: id, type: "text", placeholder: placeholder }).addClass("form-control").val(value === undefined ? "" : value);
		if (change !== undefined)
			i.change(function() { change(i); });
		return i;
	}
	
	function formInput(id, label, value, change) {
		return formElement(id, label, input(id, value, undefined, change));
	}
	
	function order() {
		reset(true);
		page = "order";
		var f = $("<div/>");
		var bo = $("<button/>", { id: "button-order" }).addClass("btn").addClass("btn-success").text("Order").attr("disabled", cli.item === undefined).click(function() {
			reset(false);
			ord.getForCreate(function() {
				ord.item.demoOrdCliId = cli.item.row_id;
				// ZZZ these referred fields must be set because they are used by business rules
				ord.item.demoOrdCliId__demoCliCode = cli.item.demoCliCode;
				
				ord.item.demoOrdPrdId = prd.item.row_id;
				// ZZZ these referred fields must be set because they are used by business rules
				ord.item.demoOrdPrdId__demoPrdReference = prd.item.demoPrdReference;
				ord.item.demoOrdPrdId__demoPrdUnitPrice = prd.item.demoPrdUnitPrice;
				ord.item.demoOrdPrdId__demoPrdStock = prd.item.demoPrdStock;
				
				ord.item.demoOrdQuantity = parseInt($("#quantity").val());
				ord.item.demoOrdComments = "Order placed on the web site";
				
				ord.create(function() {
					info("Your order has been placed with number <strong>" + ord.item.demoOrdNumber + "</strong>, total = " + amount(ord.item.demoOrdTotal));
					f.html($("<button/>").addClass("btn").addClass("btn-primary").text("Back to catalog").click(function() { catalog(); }));
				});
			});
		});
		var bc = $("<button/>", { id: "button-cancel" }).addClass("btn").addClass("btn-danger").text("Cancel").click(function() { catalog(); });
		f.append(row().append(formInput("quantity", "Quantity", 1)));
		f.append(row().append(formElement("buttons", "&nbsp;", $("<div/>", { style: "text-align: center; padding: 10px;" }).append(bo).append("&nbsp;").append(bc))));
		var r = row();
		r.append($("<div/>").addClass("col-md-4")
				//.append($("<img/>", { src: "data:" + prd.item.demoPrdPicture.mime + ";base64," + prd.item.demoPrdPicture.content })).append("<br/>")
				.append($("<img/>", { src: app.imageURL(prd.metadata.name, "demoPrdPicture", prd.item.row_id, prd.item.demoPrdPicture, false) })).append("<br/>")
				.append($("<h1/>").text(prd.item.demoPrdSupId__demoSupName))
				.append($("<h2/>").text(prd.item.demoPrdName + " (" + prd.item.demoPrdReference+ ")"))
				.append($("<p/>").html("Unit price = " + amount(prd.item.demoPrdUnitPrice)))
				.append(f));
		r.append($("<div/>").addClass("col-md-8")
				.append($("<h3/>").text("Detailed description"))
				.append(prd.item.demoPrdDocumentation)
				.append(prd.item.demoPrdBrochure ? $("<p/>").append($("<a/>", { href: app.documentURL(prd.metadata.name, "demoPrdBrochure", prd.item.row_id, prd.item.demoPrdBrochure, "attachment") }).append("Download brochure")) : ""));
		$main.empty().append(panel(r, "Place an order"));
		$(cli.item === undefined ? "#demoCliCode" : "#quantity").select().focus();
	}
	
	function orders() {
		function message_click() {
			contact($(this).data("item"));
		}
		reset(true);
		page = "orders";
		if (cli.item === undefined) {
			$main.html("");
			$("#demoCliCode").select().focus();
		} else {
			ord.search(function() {
				if (ord.list.length > 0) {
					var t = $("<table/>").addClass("table");
					t.append($("<thead/>").append($("<tr/>")
							.append($("<th/>").text("Number"))
							.append($("<th/>").text("Date"))
							.append($("<th/>").text("Status"))
							.append($("<th/>").text("Product"))
							.append($("<th/>").text("Quantity"))
							.append($("<th/>").text("Total"))
							.append($("<th/>").text("Message"))
					));
					var tb = $("<tbody/>");
					for (var i = 0; i < ord.list.length; i++) {
						var o = ord.list[i];
						var tr = $("<tr/>")
								.append($("<td/>").text(o.demoOrdNumber))
								.append($("<td/>").text(date(o.demoOrdDate)))
								.append($("<td/>").text(ord.getListValue(ord.getField("demoOrdStatus").listOfValues, o.demoOrdStatus)))
								.append($("<td/>").text(o.demoOrdPrdId__demoPrdSupId__demoSupName + " / " + o.demoOrdPrdId__demoPrdName))
								.append($("<td/>").text(o.demoOrdQuantity))
								.append($("<td/>").html(amount(o.demoOrdTotal)))
								.append($("<td/>").append($("<button/>").addClass("btn").addClass("btn-primary").addClass("btn-xs").text("Message").data("item", o).click(message_click)));
						var s = o.demoOrdStatus;
						if (s === "P")
							tr.addClass("danger");
						else if (s === "V")
							tr.addClass("warning");
						else if (s === "D")
							tr.addClass("success");
						else
							tr.addClass("active");
						tb.append(tr);
					}
					t.append(tb);
					$main.html(panel(t, $("<div/>").append("Your last orders").append($("<div/>", { style: "float: right;" }).addClass("btn glyphicon glyphicon-refresh").click(orders))));
				} else {
					$main.html("");
					warning("No orders");
				}
			}, { demoOrdCliId: cli.item.row_id }, { page: 0 });
		}
	}

	function messages() {
		reset(true);
		page = "messages";
		if (cli.item === undefined) {
			$main.html("");
			$("#demoCliCode").select().focus();
		} else {
			ctc.search(function() {
				if (ctc.list.length > 0) {
					var t = $("<table/>").addClass("table");
					t.append($("<thead/>").append($("<tr/>")
							.append($("<th/>").text("Date"))
							.append($("<th/>").text("Status"))
							.append($("<th/>").text("Message"))
					));
					var tb = $("<tbody/>");
					for (var i = 0; i < ctc.list.length; i++) {
						var o = ctc.list[i];
						var tr = $("<tr/>")
								.append($("<td/>").text(date(o.demoCtcDatetime)))
								.append($("<td/>").text(ctc.getListValue(ctc.getField("demoCtcStatus").listOfValues, o.demoCtcStatus)))
								.append($("<td/>").html(o.demoCtcComments));
						var s = o.demoCtcStatus;
						if (s === "O")
							tr.addClass("danger");
						else if (s === "P")
							tr.addClass("warning");
						else
							tr.addClass("success");
						tb.append(tr);
					}
					t.append(tb);
					$main.html(panel(t, $("<div/>").append("Your last messages").append($("<div/>", { style: "float: right;" }).addClass("btn glyphicon glyphicon-refresh").click(messages))));
				} else {
					$main.html("");
					warning("No messagess");
				}
			}, { demoCtcCliId: cli.item.row_id, demoCtcCanal: "WEB" }, { page: 0 });
		}
	}
	
	function agenda() {
		reset(true);
		page = "agenda";
		$main.empty();
		if (cli.item === undefined) return;
		var agd = $("<div/>", { id: "agenda", style: "margin-top: 10px;" });
		$main.append(agd);
		agd.fullCalendar({
			header: {
				left: "prev,next today",
				center: "title",
				right: "month,agendaWeek,agendaDay"
			},
			defaultView: "agendaWeek",
			timezone: "local",
			editable: false,
			minTime: "06:00:00",
			maxTime: "22:00:00",
			eventClick: function(e) {
				$popup.title.empty().append(e.title);
				var ordId = e.id;
				$popup.body.empty().append($("<p/>").html("TODO: get order for row ID = " + ordId));
				$popup.ok.click(function() { return undefined; });
				$popup.show();
			},
			events: function(start, end, tz, callback) {
				var f = "YYYY-MM-DD HH:mm:ss";
				var dmin = start.format(f);
				var dmax = end.format(f);
				console.debug("calendar view = " + dmin + " to " + dmax);
				ord.search(function() {
					console.debug(ord.list.length + " orders found between " + dmin + " and " + dmax);
					var evts = [];
					for (var i = 0; i < ord.list.length; i++) {
						var o = ord.list[i];
						if (o.demoOrdDeliveryDate !== "") { // When using intervals empty values are included !
							evts.push({
								id: o.row_id,
								title: "Number " + o.demoOrdNumber + "\n(" + o.demoOrdQuantity + " " + o.demoOrdPrdId__demoPrdReference + ")",
								start: moment(o.demoOrdDeliveryDate),
								className: o.demoOrdStatus == "D" ? "btn-success" : (o.demoOrdStatus == "V" ? "btn-warning" : "btn-danger"),
								borderColor: "lightgray",
								data: o
							});
						}
					}
					console.debug(evts.length + " orders displayed between " + dmin + " and " + dmax);
					callback(evts);
				}, { demoOrdCliId: cli.item.row_id, dmin__demoOrdDeliveryDate: dmin, dmax__demoOrdDeliveryDate: dmax, demoOrdStatus: "P;V;D" }, { inlineDocs: false });
			}
		});
	}

	function news() {
		reset(true);
		page = "news";
		app.getNews(function() {
			$main.empty();
			if (app.news.length > 0) {
				for (var i = 0; i < app.news.length; i++) {
					var n = app.news[i];
					var nr = row();
					nr.append($("<div/>").addClass("col-md-1").append($("<img/>", { style: "border: solid 1px grey;", src: "data:" + n.image.mime + ";base64," + n.image.content })));
					nr.append($("<div/>").addClass("col-md-11").append($("<h3/>").append(n.title)).append(n.content));
					$main.append(panel(nr, n.date));
				}
			} else {
				$main.html("");
				warning("No news");
			}
		}, { inlineImages: true });
	}

	return { init: init };
})(jQuery);