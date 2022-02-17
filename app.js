const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
// const items = ["Buy Food", "Cook Food", "Eat Food"];
// const workItems = [];

const app = express();
app.use(bodyParser.urlencoded({
  extended: true
}));

// this line of code is telling the 'app' using 'express()'' to use the 'ejs' as 'view engine'
app.set('view engine', 'ejs');
// express.static is used to tell the browser to find the css file location in inside the "publick folder"
app.use(express.static("public"));

mongoose.connect("mongodb+srv://<user-name>:<password>@cluster0.dhbkw.mongodb.net/todolistDB?retryWrites=true&w=majority", { useUnifiedTopology: true });

const itemsSchema = {
  name: String,
};

const Item = mongoose.model("Item", itemsSchema);
// how to create "mongoose document in model"
const item1 =  new Item({
  name: "Welcome to your Todo-List!"
});

const item2 = new Item({
  name: "Hit the + button to add a new item."
});

const item3 = new Item({
  name: "Check off the checkbox to delete item."
});

const defaulItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
}
const List = mongoose.model("List", listSchema)

app.get("/", function(req, res) {

  // mongoose find() to find all the items
  Item.find({}, function(err, results){
    // if "results array" is empty insert itmes array to the database which is the item collection. if results isn't empty, render the "list" ejs
    if (results.length === 0){
      Item.insertMany(defaulItems, function(err){
        if (err){
          console.log(err);
        }else{
          console.log("Inserted Successfully to our database!");
        }
      });
      // so when the code run into redirect it will go back to the root route which is app.get("/") and then it goes through Item.insertMany one more time but this time it will skip to the else statement
      // becasue "results" aren't empty anymore.
      res.redirect("/");
    }else{
      // redner a file call list that has to exist inside the views folder and has to have extension .ejs and in that list of file we pass sigle variable that name "listTile" and value we give is "today"
      res.render('list', {
        listTitle: "Today",
        newListItems: results
      });
    }
  });
});

app.get("/:customListName", function(req, res){
  const customListName = _.capitalize(req.params.customListName);
  // find the list that user type in which is "name: customListName"
  List.findOne({name: customListName}, function(err, foundList){
    if (!err){
      // if list hasn't been created then create one then save to database, else
       if (!foundList){
         // create new list
         const list =  new List({
           // customListName is based on the users type in the url
           name: customListName,
           items: defaulItems
         });
           list.save();
           res.redirect("/" + customListName);
       }else{
         // Show an existing list
         res.render('list', {
           // to access foundList.name and foundList.items then render it to the list.ejs
           listTitle: foundList.name,
           newListItems: foundList.items
         });
       }
    }
  });

});

app.post("/", function(req, res) {
  // when a post request is triggered on the home route "/", will save the value of 'newItem' to variable 'item' (item = req.body.newItem) and it will redirect to the home route which trigger the
  // app.get("/", function{}) and will pass res.render("list", {kindOfDay: day,  newListItem: item })
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });
  if (listName === "Today"){
    // save the item to the item collection
    item.save();
    // redirect to the home route if we dont redirect it won't show on the screen when we add new items
    res.redirect("/");
  }else {
    List.findOne({name: listName}, function(err, foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }

});

app.post("/delete", function(req, res){
  const checkItemId = req.body.checkBox;
  const listName = req.body.listName;

  if (listName === "Today"){
    Item.findByIdAndRemove(checkItemId, function(err){
      if (!err){
        console.log("Successfully deleted");
        res.redirect("/");
      }
    });
  }else{
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkItemId}}}, function(err, foundList){
      if (!err){
        res.redirect("/" + listName);
      }
    })
  }

});

app.get("/about", function(req, res){
  res.render("about")
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
  console.log("Server has started Successfully.");
});
