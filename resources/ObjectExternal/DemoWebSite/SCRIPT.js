const DemoWebSite = (function($) {
	let app, prd, cli, ord, ctc, page;
	let $loading, $header, $main, $info, $warning, $error, $popup;

	function info(msg)    { $info.html(msg).slideDown(); }
	function warning(msg) { $warning.html(msg).slideDown(); }
	function error(err)   { $error.html(app.getErrorMessage(err)).slideDown(); }

	function amount(v) { return parseFloat(v).toFixed(2) + " &euro;"; }
	function date(d)   { return new Date(Date.parse(d)).toDateString(); }

	function render(params) {
		$loading = $("<img/>", { src: params.loadingImage });

		$("#demoLogo").append($("<img/>", { src: params.logoImage }).click(catalog));
		$("#demoCatalogMenu").click(catalog);
		$("#demoOrdersMenu").click(orders);
		$("#demoMessagesMenu").click(messages);

		$header = $("#demoHeader");
		$main = $("#demoMain").html($loading);
		$("#demoFooter").html(params.copyright);

		$info = $("#demoInfo");
		$warning = $("#demoWarning");
		$error = $("#demoError");

		const t = $("<h4/>").addClass("modal_title");
		const b = $("<div/>").addClass("modal-body");
		const ok = $("<button/>", { type: "button" }).addClass("btn").addClass("btn-primary").attr("data-dismiss", "modal").append("OK");
		const p = $("<div/>").addClass("modal").addClass("fade").attr("tabindex", -1).attr("role", "dialog").attr("aria-hidden", true).append(
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

		app = new Simplicite.Ajax(params.root, "api", "website", "simplicite");

		app.setInfoHandler(info);
		app.setWarningHandler(warning);
		app.setErrorHandler(error);

		session();
	}

	function session() {
		const token = localStorage ? localStorage.getItem("authtoken") : undefined;
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
		$popup.body.empty().append($("<div/>").append("Your message:")).append($("<textarea/>", { id: "demoMessage", style: "width: 100%; height: 200px;" }));
		$popup.ok.click(function() {
			ctc.getForCreate(function() {
				ctc.item.demoCtcCliId = cli.item.row_id;
				ctc.item.demoCtcType = "OTH";
				ctc.item.demoCtcCanal = "WEB";
				ctc.item.demoCtcMessages = $("#demoMessage").val();
				if (orderItem !== undefined)
					ctc.item.demoCtcOrdId = orderItem.row_id;

				ctc.create(function() {
					$popup.hide();
					info("Your message has been sent !");
					setTimeout(messages, 2000);
				});
			});
		});
		$popup.show();
	}

	function client() {
		$header.empty().append(row().append($("<div/>").addClass("col-md-4").append(input("demoCliCode", "", "Enter your customer code", function(cc) {
			reset(false);
			cli.search(function() {
				if (cli.list.length == 1) {
					cli.item = cli.list[0];
					$header.empty()
							.append("You are connected as <strong>" + cli.item.demoCliFirstname + " " + cli.item.demoCliLastname + "</strong>").append("&nbsp;&nbsp;")
							.append($("<button/>").addClass("btn").addClass("btn-primary").addClass("btn-xs").text("Message").click(function() { contact(); }))
							.append("&nbsp;&nbsp;")
							.append($("<button/>").addClass("btn").addClass("btn-danger").addClass("btn-xs").text("Quit").click(function() {
								cli.item = undefined;
								if (page != "news") catalog();
								client();
							}));
					$("#demoOrdersMenu").removeClass("disabled");
					$("#demoMessagesMenu").removeClass("disabled");
					if (page === "order")
						$("#demoOrderButton").attr("disabled", false);
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

	function card(body, heading, style, span) {
		const p = $("<div style=\"margin: 4px;\"/>").addClass("card").addClass("bg-" + (style === undefined ? "default" : style));
		if (heading)
			p.append($("<div/>").addClass("card-header").append($("<div/>").addClass("card-title text-center").append(heading)));
		if (body.is("table"))
			return p.append(body);
		else
			p.append($("<div/>").addClass("card-body").append(body));
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
			let r = row();
			for (let i = 0; i < prd.list.length; i++) {
				if (i !== 0 && i % 4 === 0) {
					$main.append(r);
					r = row();
				}
				const item = prd.list[i];
				const pt = item.demoPrdSupId__demoSupName + " / " + item.demoPrdName;
				//const pi = $("<img/>", { style: "height: 200px;", title: item.demoPrdReference, src: "data:" + item.demoPrdPicture.mime + ";base64," + item.demoPrdPicture.content }).popover({ content: item.demoPrdDescription });
				const pi = $("<img/>", { style: "height: 150px;", title: item.demoPrdReference, src: app.imageURL(prd.getName(), "demoPrdPicture", item.row_id, item.demoPrdPicture, false) }).popover({ content: item.demoPrdDescription });
				const pp = $("<strong/>", { style: "margin-right: 25px;" }).append(amount(item.demoPrdUnitPrice));
				const b = $("<button/>").addClass("btn").addClass("btn-success").text("Order").data("item", item).click(order_click);
				r.append(card($("<div/>").addClass("text-center").append(pi).append("<hr/>").append($("<p/>").addClass("text-right").append(pp).append(b)), pt, "default", 3));
			}
			if (r !== undefined) $main.append(r);
		}/*, undefined, /*{ inlineDocs: true }*/);
	}

	function formElement(id, label, content) {
		const fg =$("<div/>").addClass("form-group");
		if (label)
			fg.append($("<label/>").attr("for", id).append(label));
		fg.append($("<div/>").append(content));
		return fg;
	}

	function input(id, value, placeholder, change) {
		const i = $("<input/>", { id: id, type: "text", placeholder: placeholder }).addClass("form-control").val(value === undefined ? "" : value);
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
		const f = $("<div/>");
		const bo = $("<button/>", { id: "demoOrderButton" }).addClass("btn").addClass("btn-success").text("Order").attr("disabled", cli.item === undefined).click(function() {
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
				
				ord.item.demoOrdQuantity = parseInt($("#demoQuantity").val());
				ord.item.demoOrdComments = "Order placed on the web site";
				
				ord.create(function() {
					info("Your order has been placed with number <strong>" + ord.item.demoOrdNumber + "</strong>, total = " + amount(ord.item.demoOrdTotal));
					f.html($("<button/>").addClass("btn").addClass("btn-primary").text("Back to catalog").click(function() { catalog(); }));
				});
			});
		});
		const bc = $("<button/>", { id: "button-cancel" }).addClass("btn").addClass("btn-danger").text("Cancel").click(function() { catalog(); });
		f.append(formInput("demoQuantity", "Quantity", 1));
		f.append(formElement("demoButtons", undefined, $("<div/>", { style: "text-align: center; padding: 10px;" }).append(bo).append("&nbsp;").append(bc)));
		let r = row();
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
		$main.empty().append(card(r));
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
					const t = $("<table/>").addClass("table table-striped");
					t.append($("<thead/>").append($("<tr/>")
							.append($("<th/>").text("Number"))
							.append($("<th/>").text("Date"))
							.append($("<th/>").text("Status"))
							.append($("<th/>").text("Product"))
							.append($("<th/>").text("Quantity"))
							.append($("<th/>").text("Total"))
							.append($("<th/>").text("Message"))
					));
					const tb = $("<tbody/>");
					for (let i = 0; i < ord.list.length; i++) {
						const o = ord.list[i];
						const tr = $("<tr/>")
								.append($("<td/>").text(o.demoOrdNumber))
								.append($("<td/>").text(date(o.demoOrdDate)))
								.append($("<td/>").text(ord.getListValue(ord.getField("demoOrdStatus").listOfValues, o.demoOrdStatus)))
								.append($("<td/>").text(o.demoOrdPrdId__demoPrdSupId__demoSupName + " / " + o.demoOrdPrdId__demoPrdName))
								.append($("<td/>").text(o.demoOrdQuantity))
								.append($("<td/>").html(amount(o.demoOrdTotal)))
								.append($("<td/>").append($("<button/>").addClass("btn").addClass("btn-primary").addClass("btn-xs").text("Message").data("item", o).click(message_click)));
						const s = o.demoOrdStatus;
						if (s === "P")
							tr.addClass("table-danger");
						else if (s === "V")
							tr.addClass("table-warning");
						else if (s === "D")
							tr.addClass("table-success");
						else
							tr.addClass("table-info");
						tb.append(tr);
					}
					t.append(tb);
					$main.html(card(t, $("<div/>").append("Your last orders").append($("<div/>", { style: "float: right;" }).addClass("btn glyphicon glyphicon-refresh").click(orders))));
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
					const t = $("<table/>").addClass("table table-striped");
					t.append($("<thead/>").append($("<tr/>")
							.append($("<th/>").text("Date"))
							.append($("<th/>").text("Status"))
							.append($("<th/>").text("Message"))
					));
					const tb = $("<tbody/>");
					for (let i = 0; i < ctc.list.length; i++) {
						const o = ctc.list[i];
						const tr = $("<tr/>")
								.append($("<td/>").text(date(o.demoCtcDatetime)))
								.append($("<td/>").text(ctc.getListValue(ctc.getField("demoCtcStatus").listOfValues, o.demoCtcStatus)))
								.append($("<td/>").css("white-space", "break-spaces").addClass("small").text(o.demoCtcMessages));
						const s = o.demoCtcStatus;
						if (s === "O")
							tr.addClass("table-danger");
						else if (s === "P")
							tr.addClass("table-warning");
						else
							tr.addClass("table-success");
						tb.append(tr);
					}
					t.append(tb);
					$main.html(card(t, $("<div/>").append("Your last messages").append($("<div/>", { style: "float: right;" }).addClass("btn glyphicon glyphicon-refresh").click(messages))));
				} else {
					$main.html("");
					warning("No messages");
				}
			}, { demoCtcCliId: cli.item.row_id, demoCtcCanal: "WEB" }, { page: 0 });
		}
	}

	return { render: render };
})(jQuery);