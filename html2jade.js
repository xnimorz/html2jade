//На данный момент поддержка только html to jade.

var direction = true;//true - html to jade, false - jade to html

function init()
{
	/*       смена направления "перевода"
	$(".b-top-bar-tools__replace").bind("click keypress",function()
	{
		var t = $(".b-top-bar-tools__item");
		if (t.hasClass("left-side"))
		{
			t.removeClass("left-side").addClass("right-side");
			direction = false;
		}
		else
			{
			t.removeClass("right-side").addClass("left-side");
			direction = true;
		}
	})  */

	//Перевод
	$("#translate-button").bind("click keypress", function()
	{
		var test = new htmlParser($("#input-area").val());
		test.parse();
		var result = "";
		for (var i in test.nodes)
		{
			 result += test.nodes[i].toJade() + "\r\n";
		}
		$("#output-area").val(result);
	});


}

window.onload = init;

/**
 * Информация о ноде.
 * @param type - тип ноды ("text","tag","comment")
 * @param tagName - Если нода = "tag", название ноды ("div","span" etc.)
 * @constructor
 */
function Node(type,tagName)
{
	this.type = type;
	this.tagName = tagName || "";
	//атрибуты ноды
	this.attributes = [];
	//Список дочерних нод
	this.nodes = [];
	//текстовый контент ноды (актуально под type == "text")
	this.content = "";
	this.isClosed = false;
	this.id = "";
	this.class = "";
}

/**
 * Выводит табы в зав-ти от уровня вложенности
 * @param count  - количество табов
 * @returns {string}
 */
Node.prototype.printTabs = function(count)
{
	var res = "";
	for (var i = 0; i < count; i++)
	{
		res += "\t";
	}
	return res;
}

/**
 * рекурсинвный вывод ноды в формате Jade (рекурсивный - спуск по дочерним нодам, содержащимися в nodes)
 * @param tabLevel - уровень вложенности данной ноды (кол-во предков в глубину)
 * @returns {string} - jade-формат ноды
 */
Node.prototype.toJade = function(tabLevel)
{
	//Возможные DocTypes
	var doctypes = {
		'5': 'html',
		'xml': 'version="1.0" encoding="utf-8" ?',
		'default': 'html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"',
		'transitional': 'html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"',
		'strict': 'html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd"',
		'frameset': 'html PUBLIC "-//W3C//DTD XHTML 1.0 Frameset//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-frameset.dtd"',
		'1.1': 'html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd"',
		'basic': 'html PUBLIC "-//W3C//DTD XHTML Basic 1.1//EN" "http://www.w3.org/TR/xhtml-basic/xhtml-basic11.dtd"',
		'mobile': 'html PUBLIC "-//WAPFORUM//DTD XHTML Mobile 1.2//EN" "http://www.openmobilealliance.org/tech/DTD/xhtml-mobile12.dtd"'
	};

	tabLevel = tabLevel || 0;
	//Обработка текста
	if (this.type == "text")
	{
		var textItems = this.content.split("\n");
		return this.printTabs(tabLevel) + "| " +  textItems.join(" ");
	}
	//обработка DocType
	if (this.tagName == "?xml" || this.tagName == "DOCTYPE")
	{
		for (var i in doctypes)
		{
			if (doctypes[i] == this.content)
			{

				return "!!! " + i;
			}
		}
		return "!!! 5";
	}
	//Обработка comment
	if (this.type == "comment")
	{
		var textItems = this.content.split("\n");
		return this.printTabs(tabLevel) + "//\r\n" + this.printTabs(tabLevel + 1)  +  textItems.join(" ");
	}
	//Обработка остальных типов
	var result = this.printTabs(tabLevel) + (this.tagName.match(/div/i)?"":this.tagName);

	if (this.id != "")
	{
		result += "#"+this.id;
	}
	if (this.class != "")
	{
		var items = this.class.split(" ");
		for (var i in items)
		{
			if (items[i] != "")
			result += "."+items[i];
		}
	}
   //атрибуты ноды
	var first = true;
	for(var i in this.attributes)
	{
		var format;
		if (this.attributes[i] === true)
		{
			format = i;
		}
		else
		{
			format = i+"='"+this.attributes[i] + "'";
		}
		if (first)
		{
			result += "(" + format;
			first = false;
		}
		else
			result += ", " + format;
	}
	if (!first) result+=")";
	//Дополнение дочерними нодами
	if (this.nodes.length != 0)
	{
		for (var i in this.nodes)
		{
			result += "\r\n" + this.nodes[i].toJade(tabLevel + 1);
		}

	}
	return result;
}

/**
 * рекурсинвный вывод ноды в формате HTML (рекурсивный - спуск по дочерним нодам, содержащимися в nodes)
 * @param tabLevel - уровень вложенности данной ноды (кол-во предков в глубину)
 * @returns {string} - HTML-формат ноды
 */
Node.prototype.toHtml = function(tabLevel)
{
	tabLevel = tabLevel || 0;
	//Текст
	if (this.type == "text")
	{
		return this.printTabs(tabLevel) + this.content;
	}
	//Комментарии
	if (this.type == "comment")
	{
		return "<!--" + this.content + "-->";
	}
	var result = this.printTabs(tabLevel) + "<"+(this.tagName == "DOCTYPE"? "!DOCTYPE" : this.tagName);
	//DocType
	if (this.tagName == "?xml" || this.tagName == "DOCTYPE")
	{
		result += " " + this.content + ">\r\n";
		return result;
	}

	if (this.id != "")
	{
		result += ' id="'+this.id+'"';
	}
	if (this.class != "")
	{
		result += ' class="'+this.class+'"'
	}
	//Атрибуты
	for(var i in this.attributes)
	{
		if (this.attributes[i] === true)
		{
			result += " " + i;
		}
		else
			result += " " + i + '="'  + this.attributes[i] + '"';
	}
	//Дочерние ноды
	if (this.nodes.length != 0 || this.tagName.match(/script/i))
	{
		result += ">\r\n";
		for (var i in this.nodes)
		{
			result += this.nodes[i].toHtml(tabLevel + 1) + "\r\n";
		}
		if (this.isClosed) result += this.printTabs(tabLevel) + "</" + this.tagName + ">";
	}
	else
	 if (this.isClosed) result += "/>\r\n";

	 return result;
}

/**
 * Устанавливает класс ноды
 * @param currentClass
 */
Node.prototype.setClass = function(currentClass)
{
	this.class = currentClass;
}

/**
 * устанавливает id ноды
 * @param id
 */
Node.prototype.setId = function(id)
{
	this.id = id;
}

/**
 * добавляет новый атрибут к ноде
 * @param attr - название атрибута
 * @param value - значение атрибута
 */
Node.prototype.addAttribute = function(attr, value)
{
	if (attr.match(/class/i))
	{
		this.setClass(value);
		return;
	}
	if (attr.match(/id/i))
	{
		this.setId(value);
		return;
	}
	this.attributes[attr] = value;
}

/**
 * закрывает ноду
 */
Node.prototype.close = function()
{
	this.isClosed = true;
}

/**
 * добавляет дочернюю ноду (рекурсивно)
 * @param node
 * @returns {Boolean} успех операции
 */
Node.prototype.addNode = function(node)
{
	if (this.isClosed) return false;
	//Закрытие элемента
	if (node.type == "close")
	{

		if (this.nodes.length > 0 && this.nodes[this.nodes.length-1].addNode(node))
		{
			return true;
		}
		else
		{
			if (this.tagName == node.tagName)
			{
				this.isClosed = true;
				return true;
			}
		}
		if (this.nodes.length > 0 && this.nodes[this.nodes.length - 1].isClosed)
		{
			node.type = "tag";
			node.isClosed = true;
			this.nodes.push(node);
			return true;
		}
		return false;

	}

	//Добавление нового элемента
	if (this.nodes.length > 0 && !this.nodes[this.nodes.length-1].isClosed)
	{
		return this.nodes[this.nodes.length-1].addNode(node);
	}
	else
	{
		this.nodes.push(node);
		return true;
	}
}

/**
 * добавление текстового контента ноды
 * @param content
 */
Node.prototype.addContent = function(content)
{
	this.content += content;
}

/**
 * Парсер html
 * @param target - html данные
 */
function htmlParser(target)
{
	this.target = target;
	this.nodes = [];
	this.position = 0;
	this.textNodesList =["style","script","textarea"];
}

/**
 * обработка doctype. Сохранение изменений для ноды
 * @param node
 */
 htmlParser.prototype.processDoctype = function(node)
 {
	 var attr = "";
	 while (this.target[this.position] != '>')
	 {
		 attr += this.target[this.position++];
	 }
	 node.content = attr;
 }

/**
 * опускает лишние пробельные символы
 */
htmlParser.prototype.missFreeSpace = function()
{
	while (this.target.length > this.position && this.target[this.position].match(/[\s\r\n\t]/i))
		this.position++;
}

/**
 * обработка комментариев. Сохранение изменений в ноде
 * @param node
 */
htmlParser.prototype.processComment = function(node)
{
	var attr = "";
	node.type = "comment";
	node.close();
	while (this.target.length > this.position + 3 && this.target.slice(this.position, this.position + 3) != "-->")
	{
		attr += this.target[this.position++];
	}
	node.content = attr;
	this.position+= 2;
}

/**
 * чтение атрибутов. Добавление атрибутов к ноде
 * @param node
 */
htmlParser.prototype.getAttributes = function(node)
{
	var attr = "";
	while (this.target[this.position].match(/[a-z_0-9]/i))
	{
		attr += this.target[this.position++];
	}

	if (attr != "")
	{
		var value = "";
		if (this.target[this.position] == '=')
		{
			this.position++;

			if (this.target[this.position] == "'" || this.target[this.position] == '"')
			{
				var selector = this.target[this.position] == "'"?"'":'"';
				this.position++;
				while (this.target[this.position-1] == "\\" || this.target[this.position] != selector )
				{
					value += this.target[this.position++];
				}
			}
			else
			{

				while (!((this.target[this.position]+"").match(/[\s\/>]/i)))
				{
					value += this.target[this.position++];

				}
			}
			node.addAttribute(attr,value);
		}
		else
		{
			node.addAttribute(attr,true);
		}

	}
	if (this.target[this.position] != ">")
		this.position++;
}

/**
 * Обработка содержимого ноды
 * @param node - нода, отображающая изменения
 * @param tagName - тег ноды
 */
htmlParser.prototype.parseTagInfo = function(node, tagName)
{
		this.missFreeSpace();
		if (this.target.length == this.position)
		{
			return;
		}

		if (this.target[this.position] == '/' && this.target[this.position+1] == ">")
		{
			node.close();
		}

		if (tagName == "?xml" || tagName == "DOCTYPE" )
		{
			this.processDoctype(node);
			return;
		}


		if (tagName == "--")
		{
			this.processComment(node);
			return;
		}

		this.getAttributes(node);

}

/**
 * Получает данные о ближайшем теге
 * @returns {Object} тег, его имя и позиция в тексте
 */
htmlParser.prototype.getNextTag = function()
{
	var
		tagRegExp = /<\??!?\/?[a-z0-9\-]+/i,
		tagNameRegExp = /[\?a-z0-9\-]+/i;
	var tag = this.target.match(tagRegExp);
	if (tag)
	{
		return {
					tag : tag,
					name : tag[0].match(tagNameRegExp)[0],
					pos : tag["index"]
				}
	}
	else return null;
}

/**
 * Функция- парсер html содержимого
 */
htmlParser.prototype.parse = function()
{
	var tagRegExp = /<\??!?\/?[a-z0-9\-]+/i,
		tagNameRegExp = /[\?a-z0-9\-]+/i,
		onlyText = false,
		lastTagName = "",
		newTag;
	while (this.target.length > this.position)
	{

		var node;
		this.missFreeSpace();
		if (this.target.length == this.position)
		{
			continue;
		}

		newTag = this.getNextTag();
		onlyText = this.textNodesList.indexOf(lastTagName) >= 0;
		if (newTag.pos == this.position && (!onlyText || lastTagName == newTag.name) && newTag.tag)
		{
		   node = new Node(newTag.tag[0][1] == "/"?"close":"tag",newTag.name);
		   this.position += newTag.tag[0].length;


			while (this.target.length > this.position && this.target[this.position] != '>')
			{
				this.parseTagInfo(node, newTag.name);
			}

			if (this.nodes.length == 0 || !this.nodes[this.nodes.length-1].addNode(node))
			{
				if (node.tagName.match(/doctype/i))
				{
					node.close();
				}
				this.nodes.push(node);
			}
			lastTagName = newTag.name;
			this.target = this.target.slice(this.position+1,this.target.length);
		}
		else
		{

		   var value = "",
			   isEnd = false;
		   while (!isEnd)
		   {
			   value += this.target.slice(this.position,newTag.pos);
			   if ( lastTagName == newTag.name || !onlyText)
			   {
				   isEnd = true;
			   }
			   else
			   {
				   value += this.target.slice(newTag.pos, newTag.pos + newTag.tag[0].length);
				   this.target = this.target.slice(newTag.pos + newTag.tag[0].length,this.target.length);
				   newTag.tag = this.target.match(tagRegExp);
				   if (newTag.tag)
				   {
					   newTag.name = newTag.tag[0].match(tagNameRegExp)[0];
					   newTag.pos = newTag.tag["index"];
				   }
			   }
		   }
			node = new Node("text");
			node.addContent(value);
			if (this.nodes.length == 0 || !this.nodes[this.nodes.length - 1].addNode(node))
			{
				this.nodes.push(node);
			}
			this.target = this.target.slice(newTag.pos,this.target.length);
		}
		this.position = 0;
	}

   console.log(this);
}

