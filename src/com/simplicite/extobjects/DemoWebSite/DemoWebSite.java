package com.simplicite.extobjects.DemoWebSite;

import com.simplicite.util.AppLog;
import com.simplicite.util.ExternalObject;
import com.simplicite.util.tools.HTMLTool;
import com.simplicite.util.tools.Parameters;
import com.simplicite.webapp.web.BootstrapWebPage;

/**
 * Web site custom frontend UI
 */
public class DemoWebSite extends ExternalObject {
	private static final long serialVersionUID = 1L;

	/**
	 * Display method
	 * @param params Request parameters
	 */
	@Override
	public Object display(Parameters params) {
		try {
			// ZZZ IMPORTANT ZZZ Standalone page
			setDecoration(false);

			// Bootstrap page
			BootstrapWebPage wp = new BootstrapWebPage(params.getRoot(), getDisplay());

			wp.appendJS("var ROOT = \"" + wp.getRoot() + "\";");
			wp.appendAjax();
			wp.appendJSInclude(HTMLTool.getResourceJSURL(this, "SCRIPT"));
			wp.setFavicon(HTMLTool.getResourceIconURL(this, "FAVICON"));
			wp.setReady("DemoWebSiteBootstrap.init(\"" + HTMLTool.getResourceImageURL(this, "LOADING") + "\");");

			String logo = "<img src=\"" + HTMLTool.getResourceImageURL(this, "LOGO") + "\"/>";
			wp.append("<nav class=\"navbar navbar-expand-lg navbar-dark bg-dark\" style=\"margin: 0 4px 8px 4px;\">");
			wp.append("<a class=\"navbar-brand\" id=\"menu-logo\" href=\"#\">" + logo + "</a>");
			wp.append("<button class=\"navbar-toggler\" type=\"button\" data-toggle=\"collapse\" data-target=\"#menu\">");
			wp.append("<span class=\"navbar-toggler-icon\"></span>");
			wp.append("</button>");
			wp.append("<div class=\"collapse navbar-collapse\" id=\"menu\"><div class=\"navbar-nav\">");
			wp.append("<a class=\"nav-item nav-link\" id=\"menu-catalog\" href=\"#\">Catalog</a>");
			wp.append("<a class=\"nav-item nav-link disabled\" id=\"menu-orders\" href=\"#\">My orders</a>");
			wp.append("<a class=\"nav-item nav-link disabled\" id=\"menu-messages\" href=\"#\">My messages</a>");
			wp.append("</div></div>");
			wp.append("</nav>");
			wp.append("<div id=\"header\" class=\"alert alert-primary\" style=\"margin: 4px; display: none;\"></div>");
			wp.append("<div id=\"info\" class=\"alert alert-success\" style=\"margin: 4px; display: none;\"></div>");
			wp.append("<div id=\"warning\" class=\"alert alert-warning\" style=\"margin: 4px; display: none;\"></div>");
			wp.append("<div id=\"error\" class=\"alert alert-danger\" style=\"margin: 4px;display: none;\"></div>");
			wp.append("<div id=\"main\"></div>");
			wp.append("<div id=\"footer\">&copy; Simplicit&eacute; Software</div>");

			return wp.toString();
		} catch (Exception e) {
			AppLog.error(getClass(), "display", null, e, getGrant());
			return e.getMessage();
		}
	}
}
