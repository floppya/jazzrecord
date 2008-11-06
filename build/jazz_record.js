function puts(A){if($defined(window.debug)&&window.debug==false){return }if(window.console&&console.log){switch($type(A)){case"object":console.dir(A);break;default:console.log(A)}}if(Browser.Features.air&&air){if(air.Introspector&&air.Introspector.Console){switch($type(A)){case"string":air.Introspector.Console.log(A);break;case"object":air.Introspector.Console.dump(A);break}}else{air.trace(A)}}}var JazzRecord={};JazzRecord.AirAdapter=new Class({Implements:Options,options:{dbFile:"jazz_record.db"},initialize:function(A){this.setOptions(A);this.connection=new air.SQLConnection();this.dbFile=air.File.applicationDirectory.resolvePath(this.options.dbFile);this.connection.open(this.dbFile,air.SQLMode.CREATE);this.statement=new air.SQLStatement();this.statement.sqlConnection=this.connection},run:function(B){puts(B);this.statement.text=B;this.statement.execute();var A=this.statement.getResult();return A.data},count:function(A){puts(A);A=A.toUpperCase();return this.run(A)[0]["COUNT(*)"]},save:function(A){puts(A);this.statement.text=A;this.statement.execute();return this.statement.getResult().lastInsertRowID}});JazzRecord.GearsAdapter=new Class({Implements:Options,options:{dbFile:"jazz_record.db"},initialize:function(A){this.setOptions(A);this.db=google.gears.factory.create("beta.database");this.db.open(this.options.dbFile);this.result=null},run:function(D){puts(D);this.result=this.db.execute(D);var C=[];while(this.result.isValidRow()){var F={};for(var B=0,A=this.result.fieldCount();B<A;B++){var E=this.result.fieldName(B);F[E]=this.result.field(B)}C.push(F);this.result.next()}this.result.close();return C},count:function(B){puts(B);this.result=this.db.execute(B);var A=this.result.field(0);this.result.close();return A},save:function(A){puts(A);this.db.execute(A);return this.db.lastInsertRowId}});JazzRecord.depth=2;JazzRecord.models=new Hash();JazzRecord.Record=new Class({Implements:[Options,Events],options:{model:null,columns:{},data:{}},initialize:function(A){this.id=null;this.setOptions(A);this.errors=[];this.originalData={};$each(this.options.columns,function(C,B){this[B]=null;if(this.options.data[B]){this[B]=this.options.data[B];this.originalData[B]=this.options.data[B]}if(C==="bool"){var D=(this[B]?true:false);this.originalData[B]=D;this[B]=D}},this);if(this.options.data.id){this.id=this.options.data.id}},destroy:function(){if(!this.id){throw ("Unsaved record cannot be destroyed")}else{this.fireEvent("destroy");this.options.model.destroy(this.id);this.id=null}},getData:function(){var A={};$each(this.options.columns,function(C,B){A[B]=this[B]},this);return A},revert:function(){$each(this.options.columns,function(B,A){this[A]=this.originalData[A]},this)},reload:function(){if(!this.id){throw ("Unsaved record cannot be reloaded")}else{var A=this.options.model.find(this.id);$extend(this,A)}},load:function(A,B){if(!B){B=0}if(this[A].unloaded){this[A]=this[A].loader(B)}return this[A]},updateAttribute:function(A,B){this[A]=B;this.save()},toString:function(){var A="#<Table: {modelTable} id: {id} {columnStuff}>";var B={modelTable:this.options.model.table,id:this.id};B.columnStuff="";$each(this.options.columns,function(D,C){B.columnStuff+=" "+C+": "+this[C]},this);return A.substitute(B)}});JazzRecord.Record.implement({isChanged:function(){if(!this.id){return false}$each(this.options.model.options.belongsTo,function(F,E){var D=JazzRecord.models.get(F);var C=D.options.foreignKey;if(this.originalData[C]&&!this[C]){delete this[E]}else{if(this.originalData[C]!==this[C]){}else{if(this.originalData[C]&&!this[E]){delete this[C]}else{if(this[E]){this[C]=this[E].id}}}}},this);var B=$H(this.getData());var A=$H(this.originalData);if(this.id&&B.toQueryString()===A.toQueryString()){return false}else{return true}}});JazzRecord.Record.implement({save:function(){$each(this.options.model.options.hasOne,function(F,E){var C=this.options.model.options.foreignKey;var D=JazzRecord.models.get(F);var B=D.findBy(C,this.id,0);if(B){delete B[C];B.save()}if(this[E]){this[E].updateAttribute(C,this.id)}},this);var A=this.getData();if(!this.id&&this.isValid("create")){this.id=this.options.model.save(A);this.fireEvent("create")}else{A.originalData=this.originalData;if(!this.isValid("update")||!this.isChanged()){return false}if(this.isChanged()){A.id=this.id;this.options.model.save(A);this.reload();$each(this.options.columns,function(C,B){this.originalData[B]=this[B]},this);this.fireEvent("update")}}if(this.isValid("save")){this.fireEvent("save");return true}return false}});JazzRecord.Model=new Class({Implements:Options,options:{table:"",columns:{},foreignKey:"",hasOne:{},belongsTo:{},hasMany:{},hasAndBelongsToMany:{},events:{},validate:{atCreate:$empty,atUpdate:$empty,atSave:$empty}},initialize:function(A){this.setOptions(A);this.table=this.options.table;this.sql="";if(!JazzRecord.models.has(this.table)){JazzRecord.models.set(this.table,this)}},newRecord:function(B){if(!B){B={}}var C={};$each(this.options.columns,function(E,D){C[D]=B[D]||null});var A={model:this,columns:this.options.columns,data:C};$each(this.options.events,function(E,D){A[D]=E});return new JazzRecord.Record(A)},create:function(B){var A=this.newRecord(B);A.save();return A}});var AssociationLoader=new Class({initialize:function(A){this.loader=A;this.unloaded=true},toString:function(){return"Not yet loaded"}});JazzRecord.Model.implement({columnNames:function(){var A="(";$each(this.options.columns,function(C,B){if(B!="id"){A+=B+", "}});A=A.substr(0,A.length-2);return A+")"},columnValues:function(B){var A=" VALUES(";$each(this.options.columns,function(D,C){if(C!="id"){A+=this.typeValue(C,B[C])+", "}},this);A=A.substr(0,A.length-2);return A+")"},typeValue:function(A,B){if(B==null){return"NULL"}else{switch(this.options.columns[A]){case"string":case"text":return"'"+(B||this[A])+"'";case"number":case"int":case"float":return B||this[A];case"bool":if(B||this[A]){return 1}else{return 0}}}}});JazzRecord.Record.implement({validatesAtCreate:function(){this.options.model.options.validate.atCreate.apply(this)},validatesAtUpdate:function(){this.options.model.options.validate.atUpdate.apply(this)},validatesAtSave:function(){this.options.model.options.validate.atSave.apply(this)},isValid:function(A){this.errors=[];switch(A){case"create":this.validatesAtCreate();break;case"update":this.validatesAtUpdate();break;case"save":this.validatesAtSave();break;default:throw ("Invalid event passed to isValid(). Expecting 'save', 'create' or 'update'")}if(this.errors.length!==0){return false}else{return true}},pushError:function(C,B){var A=C;if($defined(B)&&B!==""){A=B}this.errors.push(A)},validatesAcceptanceOf:function(A,B){var C=this[A];B=$defined(B)?B:(A+" must be accepted");if(C){return }else{this.errors.push(B)}},validatesConfirmationOf:function(A,B){var C=this[A];var D=this[A+"_confirmation"];if(C!==D||!$defined(D)||D==""){B=$defined(B)?B:"doesn't match confirmation"}},validatesExclusionOf:function(B,A,C){var E=this[B];var D=true;$each(A,function(F){if(E.contains(F)){D=false;if(!$defined(C)){C=F+" is reserved"+F}this.errors.push(C)}},this);return D},validatesFormatOf:function(A,C,B){val=this[A];if(!val.match(C)){if(!$defined(B)){B=val+" does not match"}this.errors.push(B)}},validatesInclusionOf:function(B,A,C){var E=this[B];var D=false;$each(A,function(F){if(E.contains(F)){D=true}});if(!D){if(!$defined(C)){C=E+" is not included in the list"}this.errors.push(C)}return D},validatesLengthOf:function(C,B,E){var D=true;var F=this[C];var A={};B=$extend(A,B);if($defined(B.minimum)){if(F.length<B.minimum){D=false}}if($defined(B.maximum)){if(F.length>B.maximum){D=false}}if($defined(B.is)||$defined(B.exactly)){if(F.length!==B.is||F.length!==B.exactly){D=false}}if($defined(B.allow_nil)){if(F!==B.allow_nill){D=false}}if(!D){if(!$defined(E)){E="impelement error messages for this later"}this.errors.push(E)}},validatesNumericalityOf:function(A,B){if(validatesIsInt(A)||validatesIsFloat(A)){return }if(!$defined(B)){B=this[A]+" is not a number"}this.errors.push(B)},validatesPresenceOf:function(A,B){var C=this[A];if(!$defined(C)||C===""){if(!$defined(B)){B=A+" can't be empty, null or blank"}this.errors.push(B)}},validatesUniquenessOf:function(A,C,B){if(findBy(A,C).length>0){if(!$defined(B)){B=C+" is not unique"}this.errors.push(B)}},validatesIsString:function(A,B){var C=this[A];if(!C||$type(C)==="string"){return }if(!$defined(B)){B=C+" is not a string"}this.errors.push(B)},validatesIsBool:function(A,B){var C=this[A];if($type(C)==="boolean"){return }if(!$defined(B)){B=C+" is not boolean"}this.errors.push(B)},validatesIsInt:function(A,B){var C=this[A];if(!C||C.toInt()===C){return }B=C+" is not a int";this.errors.push(B)},validatesIsFloat:function(A,B){var C=this[A];if(!C||C.toFloat()===C){return }if(!$defined(B)){B=C+" is not a float"}this.errors.push(B)},validatesAssociated:function(D,C){var E=true;var B=JazzRecord.models.get(this[D]);var A=B.foreignKey;if(this[D].unloaded){if(!B.find(this[A])){E=false}}else{if(!this[D].id){E=false}}if(!$defined(C)){C=D+" does not exist with ID "+this[A]}if(!E){this.errors.push(C)}return E}});JazzRecord.Model.implement({query:function(C){if(!$defined(C)){C={}}if(!$defined(C.depth)){C.depth=JazzRecord.depth}var E=C.depth-1;if(E<0){E=0}var A=this.sql;var D=JazzRecord.adapter.run(A);if(!D||D.length===0){if(this.sql.contains("LIMIT")){return null}else{return D}}var B=[];$each(D,function(H){var G={model:this,columns:this.options.columns,data:H};$each(this.options.events,function(J,I){G[I]=J});var F=new JazzRecord.Record(G);$each(this.options.hasOne,function(M,L){var K=JazzRecord.models.get(M);var I=this.options.foreignKey;var J=function(N){return K.findBy(I,H.id,N)};if(C.depth<1){F[L]=new AssociationLoader(J)}else{F[L]=J(E)}},this);$each(this.options.hasMany,function(M,L){var J=JazzRecord.models.get(M);var I=this.options.foreignKey;var K=function(N){return J.findAllBy(I,H.id,N)};if(C.depth<1){F[L]=new AssociationLoader(K)}else{F[L]=K(E)}},this);$each(this.options.belongsTo,function(L,K){var J=JazzRecord.models.get(L);var I=J.options.foreignKey;if(F[I]){var M=function(N){return J.first({id:F[I],depth:N})};if(C.depth<1){F[K]=new AssociationLoader(M)}else{F[K]=M(E)}}});$each(this.options.hasAndBelongsToMany,function(O,N){var I=[this.table,O].sort().toString().replace(",","_");var M="SELECT * FROM "+I+" WHERE "+this.options.foreignKey+" = "+F.id;F[N]=JazzRecord.adapter.run(M);var K=JazzRecord.models.get(O);var J=K.options.foreignKey;if(J){var L=function(P){return K.find({id:F[N][J],depth:P})};if(C.depth<1){F[N]=new AssociationLoader(L)}else{F[N]=L(E)}}},this);B.push(F)},this);if(A.contains("LIMIT 1")){return B[0]}else{return B}}});JazzRecord.Model.implement({save:function(B){this.sql="{saveMode} {table} {set} {data} {conditions};";var A={saveMode:"INSERT INTO",table:this.table,data:this.columnNames()+this.columnValues(B)};var C={};if(B.id){C.id=B.id;C.saveMode="UPDATE";C.set="SET";C.conditions="WHERE id="+B.id;C.data="";$each(this.options.columns,function(E,D){C.data+=D+" = "+this.typeValue(D,B[D])+", "},this);C.data=C.data.slice(0,-2)}C=$extend(A,C);this.sql=this.sql.substitute(C).clean();return JazzRecord.adapter.save(this.sql)}});JazzRecord.Model.implement({destroy:function(B){var A="";if($type(B)==="number"){A="WHERE id="+B}else{if($type(B)==="array"){A="WHERE id IN ("+B+")"}}this.sql="DELETE FROM "+this.table+" "+A;this.query()},destroyAll:function(){this.sql="DELETE FROM "+this.table;this.query()},dropTable:function(){this.sql="DROP TABLE IF EXISTS "+this.table;this.query()}});JazzRecord.Model.implement({find:function(A){if(!$defined(A)){throw ("Missing ID or Options")}else{switch($type(A)){case"array":A={id:A};break;case"number":A={id:A,limit:1};break;case"object":break;default:throw ("Type Error. Model.find() expects Number, Array or Object")}}return this.select(A)},findBy:function(B,A,C){if(!this.options.columns[B]){throw ("Column "+B+" Does Not Exist in Table "+this.table)}else{return this.select({conditions:B+"="+this.typeValue(B,A),limit:1,depth:C})}},findAllBy:function(B,A,C){if(!this.options.columns[B]){throw ("Column "+B+" Does Not Exist in Table "+this.table)}else{return this.select({conditions:B+"="+this.typeValue(B,A),depth:C})}},all:function(A){return this.select(A)},first:function(A){A=$extend({limit:1},A);return this.select(A)},last:function(A){A=$extend({limit:1,order:"id"},A);A.order+=" DESC";return this.select(A)},count:function(A){this.sql="SELECT COUNT(*) FROM "+this.table;if(A){this.sql+=" WHERE "+A}return JazzRecord.adapter.count(this.sql)},select:function(B){if(!B){B={}}this.sql="SELECT {select} FROM "+this.table+" {conditions} {order} {limit} {offset}";var A={select:"*"};B=$extend(A,B);if(!B.select=="*"&&!B.select.contains("id")){B.select="id, "+B.select}if(B.order){B.order="ORDER BY "+B.order}if($type(B.limit)=="number"){B.limit="LIMIT "+B.limit}if($type(B.offset)=="number"){B.offset="OFFSET "+B.offset}if(B.conditions){B.conditions="WHERE "+B.conditions;if(B.id){B.conditions+=" AND id="+B.id}}else{if(B.id){if($type(B.id)=="number"){B.conditions="WHERE id="+B.id;B.limit="LIMIT 1"}else{if($type(B.id)=="array"){B.conditions="WHERE id IN ("+B.id+")"}}}}this.sql=this.sql.substitute(B).clean()+";";return this.query(B)}});JazzRecord.Migration={setup:function(){this.createTable("schema_migrations",{version:"text"});if(JazzRecord.adapter.count("SELECT COUNT(*) FROM schema_migrations")==0){var A="INSERT INTO schema_migrations (version) VALUES(0)";JazzRecord.adapter.run(A)}},current:function(){var A="SELECT version FROM schema_migrations LIMIT 1";return JazzRecord.adapter.run(A)[0].version},update:function(A){var B="UPDATE schema_migrations SET version = "+A;JazzRecord.adapter.run(B)},createTable:function(A,B){if(!($defined(A)&&$defined(B))){return }var C="CREATE TABLE IF NOT EXISTS "+A;if(B){C+="(";$each(B,function(E,D){C+=(D+" "+E.toUpperCase()+", ")});C=C.substr(0,C.length-2);C+=")";JazzRecord.adapter.run(C)}},dropTable:function(A){var B="DROP TABLE "+A;JazzRecord.adapter.run(B)},renameTable:function(B,A){var C="ALTER TABLE "+B+" RENAME TO "+A;JazzRecord.adapter.run(C)},addColumn:function(C,B,A){var D="ALTER TABLE "+C+" ADD COLUMN "+B+" "+A.toUpperCase();JazzRecord.adapter.run(D)},removeColumn:function(D,C){D=JazzRecord.models[D].table;if(!D||!JazzRecord.models[D].options.columns[C]){return }var A="temp_"+D;var B=[];$each(JazzRecord.models[D].options.columns,function(F,E){if(E!=C){B.push({tempColumnName:E})}});alert(B.toSource());JazzRecord.Migration.createTable(A,B);JazzRecord.Migration.dropTable(D);JazzRecord.Migration.renameTable(A,D);JazzRecord.Migration.dropTable(A)},renameColumn:function(B,A){},changeColumn:function(B,A,C){}};JazzRecord.migrate=function(E){if(!E){E={}}if(!E.migrations){var G=[]}if(G.length>0){JazzRecord.Migration.setup();var H=JazzRecord.Migration.current();var C=G.length-1;if(E.version){C=E.version}if(C==H){puts("Up to date");return }for(var F=H,D=C;(C>H)?(F<D):(F>D);(C>H)?F++:F--){var A=G[F];A=(C>H)?A.up:A.down;var B=A[0];switch(A.length){case 4:JazzRecord.Migration[B](A[1],A[2],A[3]);break;case 3:JazzRecord.Migration[B](A[1],A[2]);break;case 2:JazzRecord.Migration[B](A[1])}JazzRecord.Migration.update(F)}}else{if(E.refresh){this.models.each(function(I){I.dropTable();$each(I.options.hasAndBelongsToMany,function(L){var J=[I.table,L].sort().toString().replace(",","_");var K="DROP TABLE IF EXISTS "+J;JazzRecord.adapter.run(K)})})}this.models.each(function(I){var J="CREATE TABLE IF NOT EXISTS "+I.table+"(id INTEGER PRIMARY KEY AUTOINCREMENT";$each(I.options.columns,function(L,K){J+=(", "+K+" "+L.toUpperCase())});J+=")";JazzRecord.adapter.run(J);$each(I.options.hasAndBelongsToMany,function(Q,L){var K=[I.table,Q].sort().toString().replace(",","_");var M=I.options.foreignKey;var N=JazzRecord.models.get(Q).options.foreignKey;var O=[M,N].sort();var P="CREATE TABLE IF NOT EXISTS "+K+"("+O[0]+" INTEGER, "+O[1]+" INTEGER)";JazzRecord.adapter.run(P)})})}if(E.fixtures){this.loadFixtures(E.fixtures)}};JazzRecord.loadFixtures=function(A){$each(A.tables,function(C,B){$each(C,function(D){JazzRecord.models.get(B).create(D)})});if(!A.mappingTables){return }$each(A.mappingTables,function(C,B){$each(C,function(F){var D=$H(F);var E="INSERT INTO "+B+" ("+D.getKeys().toString()+") VALUES("+D.getValues().toString()+")";JazzRecord.adapter.run(E)})})};