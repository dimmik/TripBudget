// helpers
	function evalAriphmetics(exp){
		var cleanExp = exp.replace(/[^\d\(\)\+\-\*\/]+/g, '+'); // фигню заменяем на плюсики
        cleanExp = cleanExp.replace(/\s/g, ''); // убираем пробелы
        cleanExp = cleanExp.replace(/\++/g, '+'); // несколько плюсов - на один
        cleanExp = cleanExp.replace(/\++$/g, ''); // плюсы в конце убираем
		//alert("ce: " + cleanExp);
		var res = -1;
		try {
			res = eval(cleanExp);
		} catch (err){
			res = -1;
		}
		return res;//
	}
	// *** Domain model ************************ 
	
	// Family
	function Family(name, peoplesNum, expenses, paid) {
		this.name = name;
		this.peoplesNum = peoplesNum;
		this.expenses = expenses;
		this.paid = paid;
	}
	Family.prototype.toDebugStr = function(){
		return "f '" + this.name + "' of " + this.peoplesNum + " e: " + this.expenses; 
	}
	Family.prototype.debt = function(avg){
		var toBeSpent = this.peoplesNum * avg;
		return (toBeSpent - evalAriphmetics(this.expenses));
	}
	
	// Trip
	function Trip(date, name, checked) {
		this.date = new Date(date);
		this.name = name;
        this.checked = checked;
		this.families = new Array(); // Family[]
	}
	Trip.prototype.toDebugStr = function(){
		var s = this.date + " - " + this.name + " - avg: " + this.averageExpense();
		for (var i = 0; i < this.families.length ; i ++)
		{
			s += "\n" + this.families[i].toDebugStr() + " d: " + this.families[i].debt(this.averageExpense());
		}
		return s;
	}
	Trip.prototype.averageExpense = function(){
		if (this.totalPeoples() == 0) return 0;
		return this.totalExpense() / this.totalPeoples();
	}
	Trip.prototype.totalExpense = function(){
		var totalExpense = 0;
		for (var i = 0; i < this.families.length ; i ++)
		{
			totalExpense += evalAriphmetics(this.families[i].expenses) * 1;
		}
		return totalExpense;
	}
	Trip.prototype.totalPeoples = function(){
		var totalPeoples = 0;
		for (var i = 0; i < this.families.length ; i ++)
		{
			totalPeoples += this.families[i].peoplesNum * 1;
		}
		return totalPeoples;
	}

	// List
	function ListOfTrips(tripsJson){
		this.trips = new Array();
		this.selected = -1;
		if (tripsJson == "" || typeof(tripsJson) == 'undefined')
		{
			return;
		}
		
		var pp = JSON.parse(tripsJson);
		this.selected = pp.selected;
		if (typeof(pp.trips) == 'undefined')
		{
			return;
		}

		for (var i = 0; i < pp.trips.length; i++)
		{
			var ppp = pp.trips[i];
			var nP = new Trip(ppp.date, ppp.name, ppp.checked);
			for (var j = 0; j < ppp.families.length; j++)
			{
				var ff = ppp.families[j];
				var family = new Family(ff.name, ff.peoplesNum, ff.expenses, ff.paid);
				nP.families[nP.families.length] = family;
			}
			this.trips[this.trips.length] = nP;
		}
	}
	ListOfTrips.prototype.add = function (p) {
		var s = this.trips.length;
		this.trips[s] = p;
		this.selected = s;
	}
	ListOfTrips.prototype.toDebugStr = function(){
		return "len: " + this.trips.length;
	}
	// /*** Domain model ************************ 

	// *** Storage ************************ 
	function storeLS(name, val){
		localStorage[name] = val;
	}
	function retrieveLS(name){
		var v = localStorage[name];
		return v;
	}

	var store = storeLS;
	var retrieve = retrieveLS;

	function storeToLocalStorage( lp ){
		var json = JSON.stringify(lp);
		store('lp',json);
	}
	
	function loadFromLocalStorage(){
	//alert("ls: " + localStorage);
		var psJson = retrieve('lp');
		if (typeof(psJson) != 'undefined')
		{
			return new ListOfTrips(psJson);
		}
		return new ListOfTrips("");
	}
	

	function addNewTrip(){
		var p = new Trip(new Date(), document.getElementById('newTripName').value, 0);
		document.getElementById('newTripName').value = '';
		ps.add(p);
		storeToLocalStorage(ps);
		initTripsListUI();
	}
	function deleteTrip(pnum){
		ps.trips.splice(pnum, 1);
		ps.selected = ps.trips.length > 0 ? 0 : -1;
		storeToLocalStorage(ps);
		cleanUIcontent();
		initTripsListUI();
	}
	function cloneTrip(name, pnum){
		var current = ps.trips[pnum];
		var clone = new Trip(new Date(), name, 0);
		clone.families = current.families;
		ps.add(clone);
		storeToLocalStorage(ps);
		ps = loadFromLocalStorage();
		initTripsListUI();
	}
	function deleteFamily(pnum, fnum){
		ps.trips[pnum].families.splice(fnum, 1);
		storeToLocalStorage(ps);
		initCurrentTrip(pnum);
	}
	function updateFamily(pnum, fnum, name, peoplesNum, expenses, paid){
		var f = ps.trips[pnum].families[fnum];
		//alert("paid: " + f.paid);
		if (
			f.name == name 
			&& f.peoplesNum == peoplesNum 
			&& f.expenses == expenses
			&& f.paid == paid)
		{
			return;
		}
		if (
		name == '' || peoplesNum == '' || expenses == '' || 
		name == null || peoplesNum == null || expenses == null 
		)
		{
			initCurrentTrip(pnum);
			return;
		}
		f.name = name;
		f.peoplesNum = peoplesNum;
		f.expenses = expenses;
		f.paid = paid;
		storeToLocalStorage(ps);
		initCurrentTrip(pnum);
	}
	
	function addNewFamily(pnum) {
		var f = new Family(document.getElementById('nfName').value, document.getElementById('nfPN').value, document.getElementById('nfExp').value, 0)
		ps.trips[pnum].families[ps.trips[pnum].families.length] = f;
		storeToLocalStorage(ps);
		initCurrentTrip(pnum);
	}
	function exportToJSON(txt){
		var json = JSON.stringify(ps, null, 4);
		txt.value = json;
		txt.focus(); txt.select();
	}
	function importFromJSON(txt) {
		var json = txt.value;
		store('lp', json);
		initDiff();
	}
	// /*** Storage ************************ 

	// *** UI ******************************
	function updateUI(){
		var div = document.getElementById("GenericUI");
		var template = document.getElementById("GenericUITemplate").innerHTML;
		for (var k in UIcontent){
			//alert("key: " + k + " v: " + UIcontent[k]);
			template = template.replace("${"+k+"}", UIcontent[k]);
		}
		//alert("t: " + template);
		template = template.replace(/\$\{currencySign\}/g, getCurrencySign());
		div.innerHTML = template;
		if (document.getElementById("tripSelect") && document.getElementById("tripSelect").options[document.getElementById("tripSelect").selectedIndex].value == -1)
		{
			document.getElementById('additions').style.visibility = 'visible';
		}
		//setCollapsed(document.getElementById('collapseButton'),document.getElementById('collapsable'));
	}
	function getpList(){
		var t = document.getElementById("tripsListTemplate").innerHTML;
		var s = "";
		var optionTemplate = document.getElementById("tripOptionTemplate").innerHTML;
		for (i = 0; i < ps.trips.length; i++)
		{
			var p = ps.trips[i];
			var o = optionTemplate.replace(/\$\{name\}/g, ps.trips[i].name);
			var d = ps.trips[i].date;
			o = o.replace(/\$\{date\}/g, d.toDateString());
			o = o.replace(/\$\{pnum\}/g, i);
			o = o.replace(/\$\{selected\}/g, ps.selected == i ? 'selected' : '')
			o = o.replace(/\$\{checked\}/g, ps.trips[i].checked == 1 ? 'checked' : '')
			o = o.replace(/\$\{avgExpense\}/g, p.averageExpense().toFixed(0));
			o = o.replace(/\$\{totalExpense\}/g, p.totalExpense().toFixed(0));
			o = o.replace(/\$\{totalPeoples\}/g, p.totalPeoples().toFixed(1));
			s += o;
		}
		t = t.replace(/\$\{trips\}/g, s);

		t = t.replace(/\$\{id\}/g, "pListUI");
		return t;
	}
	function initTripsListUI(){
		UIcontent["pListUI"] = getpList();
		updateUI();
		
		if (ps.selected > -1)
		{
			initCurrentTrip(ps.selected);
		} else {
			document.getElementById('additions').style.visibility = 'visible';
		}
	}

	function initCurrentTrip(pnumX){
        // -2 = calculations for aggregated values. 
		var pnum = -1;
		if (typeof(pnumX) == 'undefined')
		{
			pnum = document.getElementById("tripSelect").options[document.getElementById("tripSelect").selectedIndex].value;
			if (pnum == -1)
			{
				return;
			}
		} else {
			pnum = pnumX;
		}
        if (pnum != -2){
            ps.selected = pnum;
            storeToLocalStorage(ps);

            var p = ps.trips[pnum];
            var div = document.getElementById("currentTrip");
    //		var s = "";
            // header
            var pTemplate = document.getElementById("tripHeaderTemplate").innerHTML;
            var o = pTemplate.replace(/\$\{name\}/g, p.name);
            o = o.replace(/\$\{date\}/g, p.date.toDateString());
            o = o.replace(/\$\{avgExpense\}/g, p.averageExpense().toFixed(0));
            o = o.replace(/\$\{totalExpense\}/g, p.totalExpense().toFixed(0));
            o = o.replace(/\$\{totalPeoples\}/g, p.totalPeoples().toFixed(1));
            o = o.replace(/\$\{pnum\}/g, pnum);

            o = o.replace(/\$\{id\}/g, "pHeaderUI");
            UIcontent["pHeaderUI"] = o;
        } else {
            p = ps.trips[0];
        }
//		s += o;
		// families list
		var flT = document.getElementById("familyListTemplate").innerHTML;
		var fl = "";
        if (pnumX == -2){ // aggregated
            // for aggregate - list of checked trips
            var aggregatedTrips = getAggregatedTrips();
            //alert("at: " + aggregatedTrips);
            flT = flT.replace(/\$\{aggregatedTrips\}/g, aggregatedTrips);
        }
		for (i = 0; i < p.families.length; i++)
		{
            if (pnumX != -2){ // regular
                var f = p.families[i];
                var debt = f.debt(p.averageExpense())*1 - f.paid;
                var fTemplate = document.getElementById("oneFamilyTemplate").innerHTML;
                o = fTemplate.replace(/\$\{name\}/g, f.name);
                o = o.replace(/\$\{peoplesNum\}/g, f.peoplesNum * 1);
                o = o.replace(/\$\{expenses\}/g, f.expenses);
                o = o.replace(/\$\{expensesEval\}/g, evalAriphmetics(f.expenses));
                o = o.replace(/\$\{paid\}/g, f.paid);
                o = o.replace(/\$\{debt\}/g, debt.toFixed(0));
                o = o.replace(/\$\{debtAbs\}/g, Math.abs((debt).toFixed(0)));
                o = o.replace(/\$\{debtS\}/g, debt > 0 ? '1' : '0');
                o = o.replace(/\$\{debtAction\}/g, debt > 0 ? 'give' : 'get');
                o = o.replace(/\$\{pnum\}/g, pnum);
                o = o.replace(/\$\{fnum\}/g, i);
                o = o.replace(/\$\{mod2\}/g, i%2);
                fl += o;
            } else { // aggregated
                var f = p.families[i];
                var checkedTrips = getSelectedTrips();
                var template = document.getElementById("oneAggregatedTripCell").innerHTML;
                var aggregateDebt = 0;
                var debts = [];
                var counts = "";
                for (var j = 0; j < checkedTrips.length; j++){
                    var tr = checkedTrips[j];
                    var tripF = findFamily(f, tr);
                    var debt = tripF.debt(tr.averageExpense())*1 - tripF.paid;
                    aggregateDebt += debt;
                    counts += template.replace(/\$\{debt\}/g, (debt > 0 ? "-" : "+") + "" + Math.abs(debt.toFixed(0)))
                    .replace(/\$\{style\}/g, (debt > 0 ? "minus" : "plus"));
                    ;
                }
                counts += template.replace(/\$\{debt\}/g, (aggregateDebt > 0 ? "- " : "+ ") + "" + Math.abs(aggregateDebt.toFixed(0)))
                                    .replace(/\$\{style\}/g, (aggregateDebt > 0 ? "totalminus" : "totalplus"))
;
                var fTemplate = document.getElementById("oneFamilyTemplate").innerHTML;
                o = fTemplate.replace(/\$\{name\}/g, f.name)
                .replace(/\$\{debtCounts\}/g, counts);
                ;
                //o = o.replace(/\$\{peoplesNum\}/g, f.peoplesNum * 1);
                //o = o.replace(/\$\{expenses\}/g, f.expenses);
                //o = o.replace(/\$\{expensesEval\}/g, evalAriphmetics(f.expenses));
                //o = o.replace(/\$\{paid\}/g, f.paid);
                //o = o.replace(/\$\{debt\}/g, debt.toFixed(0));
                //o = o.replace(/\$\{debtAbs\}/g, Math.abs((debt).toFixed(0)));
                //o = o.replace(/\$\{debtS\}/g, debt > 0 ? '1' : '0');
                //o = o.replace(/\$\{debtAction\}/g, debt > 0 ? 'give' : 'get');
                //o = o.replace(/\$\{pnum\}/g, pnum);
                o = o.replace(/\$\{fnum\}/g, i);
                o = o.replace(/\$\{mod2\}/g, i%2);
                fl += o;
            }
		} 
		flT = flT.replace(/\$\{families\}/g, fl);
		flT = flT.replace(/\$\{id\}/g, "familiesListUI");
		UIcontent["familiesListUI"] = flT;
		
		var addF = document.getElementById("addFamilyTemplate").innerHTML.replace(/\$\{pnum\}/g, pnum);
		addF = addF.replace(/\$\{id\}/g, "addFamilyUI");
		UIcontent["addFamilyUI"] = addF;

		UIcontent["pListUI"] = getpList();
		updateUI();
	}

    function findFamily(f, tr){
        for (var i = 0; i < tr.families.length; i++){
            if (tr.families[i].name == f.name){
                return tr.families[i];
            }
        }
    }
    
    function getSelectedTrips(){
        var checkedTrips = [];
        for (var i = 0; i < ps.trips.length; i ++){
            if (document.getElementById("tripcheckbox_" + i).checked){
                checkedTrips[checkedTrips.length] = ps.trips[i];
                ps.trips[i].checked = 1;
            } else {
                ps.trips[i].checked = 0;
            }
        }
        storeToLocalStorage(ps);
        //alert("len: " + checkedTrips.length);
        return checkedTrips;
    }
    
    function getAggregatedTrips(){
        
        var template = document.getElementById("oneAggregatedTripHeader").innerHTML;
        var res = "";
        var checkedTrips = getSelectedTrips();
        for (var i = 0; i < checkedTrips.length; i ++){
           res += template.replace(/\$\{name\}/g, checkedTrips[i].name);
        }
        res += template.replace(/\$\{name\}/g, "Total");
        //alert("len: " + checkedTrips.length);
        return res;
    }
	function getCurrencySign(){
		var cc = retrieve('currentCurrencySign');
		if (typeof(cc) == 'undefined')
		{
			return 'р.';
		}
		return '=';
	}
	function updateCurrencySign(sign){
		store('currentCurrencySign', sign);
		updateUI();
	}
	// /*** UI ******************************
	
/*
	${pListUI}
	<hr>
	${addNewTrip}
	<hr>
	${pHeaderUI}
	<hr>
	${familiesList}
	<hr>
	${addFamily}
*/
	function cleanUIcontent(){
		UIcontent = new Array();
		UIcontent["pListUI"] = "--"; // +
		UIcontent["addNewTripUI"] = document.getElementById("addNewTripTemplate").innerHTML; 
		UIcontent["pHeaderUI"] = "--"; // +
		UIcontent["familiesListUI"] = "--"; // +
		UIcontent["addFamilyUI"] = "--"; // +
		UIcontent["currencySignUI"] = document.getElementById("currencySignTemplate").innerHTML;
		// jsonExportImportTemplate
		UIcontent["jsonExportImportUI"] = document.getElementById("jsonExportImportTemplate").innerHTML;
	}
	function initDiff(){
		cleanUIcontent();
		ps = loadFromLocalStorage();
		initTripsListUI();
		updateUI();
	}	
    function initAggregate(){
		cleanUIcontent();
		ps = loadFromLocalStorage();
		initTripsListUI();
        initCurrentTrip(-2);
		updateUI();
	}