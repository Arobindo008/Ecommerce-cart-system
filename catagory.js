var express = require('express');
const path = require('path');
var bodyParser = require('body-parser');
const mysql = require('mysql');
const session = require('express-session');


mysql.createConnection({
    host:"localhost",
    user:"root",
    password:"",
    database:"astore"
});

const app = express();

 app.set('views',path.join(__dirname,'views'));
 app.set('view engine','ejs');
 app.use(express.static(path.join(__dirname,'public')));
 
 app.listen(3000,()=>{
    console.log('run it 3000');
});

app.use(bodyParser.urlencoded({extended:true})); 

app.use(session({secret:"secret"}))



// cart code start
function isProductInCart(cart,id){
      for(let i=0;i<cart.length;i++){
        if(cart[i].id==id){
            return true;
        }
      }
    return false;
}


function calculateTotal(cart,req){
    total = 0;
    for(let i=0;i<cart.length;i++){
        if(cart[i].dis_price){
            total = total + (cart[i].dis_price*cart[i].quantity);
        }
        else{
            total = total + (cart[i].price*cart[i].quantity)
        }
    }
    req.session.total = total;
    return total;
}

app.get('/',(req,res) =>{

    var con = mysql.createConnection({
        host:"localhost",
        user:"root",
        password:"",
        database:"astore"
    });

     con.query("SELECT * FROM products",(err,result)=>{

        res.render('pages/catagory',{result:result});
        

     });
      
});

// cart code
app.post('/add_to_cart',function(req,res){
    
      var id = req.body.id;
      var name = req.body.name;
      var price = req.body.price;
      var quantity = req.body.quantity;
      var image = req.body.image;
      var product = {id:id,name:name,price:price,quantity:quantity,image:image}

      if(req.session.cart){
        var cart  = req.session.cart;

        if(!isProductInCart(cart,id)){
            cart.push(product);
        }
      }
      else{
        req.session.cart = [product];
        var cart = req.session.cart;
      }

      //calculate tolal
      calculateTotal(cart,req);

      // return to cart page 
      res.redirect('/cart');
});

app.get('/cart',function(req,res) {
   
    var cart = req.session.cart;
    var total = req.session.total;

    res.render('pages/cart',{cart:cart,total:total});
    
});

app.post('/remove_product',function(req,res){

      var id  = req.body.id;
      var cart = req.session.cart;

      for(let i=0;i<cart.length;i++){
        if(cart[i].id == id){
            cart.splice(cart.indexOf(i),1);
        }
      }
     
      //re-calculate
      calculateTotal(cart,req);
      res.redirect('/cart');

});

app.post('/edit_product_quantity',function(req,res){
    //get value from input
    var id = req.body.id;
    var quantity = req.body.quantity;
    var increase_btn = req.body.increase_product_quantity;
    var decrease_btn = req.body.decrease_product_quantity;

    var cart  = req.session.cart;

    if(decrease_btn){
        for(let i=0;i<cart.length;i++){
            if(cart[i].id == id){
                if(cart[i].quantity > 1){
                    cart[i].quantity = parseInt(cart[i].quantity)-1;
                }
            }
        }
    }

    if(increase_btn){
        for(let i=0;i<cart.length;i++){
            if(cart[i].id == id){
                if(cart[i].quantity > 0){
                    cart[i].quantity = parseInt(cart[i].quantity)+1;
                }
            }
        }
    }

    calculateTotal(cart,req);
    res.redirect('/cart')

});


// new code start 
app.get('/checkout',function(req,res){

    var total = req.session.total
    res.render('pages/checkout',{total:total});
});

app.post('/place_order',function(req,res){
     
    var name  = req.body.name;
    var email  = req.body.email;
    var phone  = req.body.phone;
    var city  = req.body.city;
    var address  = req.body.address;
    var cost  = req.session.total;
    var status  = "paid";
    var date  = new Date();
    var product_ids = "";
    
    var con = mysql.createConnection({
        host:"localhost",
        user:"root",
        password:"",
        database:"astore"
    });

    var cart = req.session.cart;
    for(let i=0;i<cart.length;i++){
        product_ids = product_ids +","+ cart[i].id;
    }

     con.connect((err)=>{
        if(err){
            console.log(err);
        }
        else{
            var query = "INSERT INTO orders(cost,name,email,status,city,address,phone,date,product_ids) VALUES ?";
            var values = [
                [cost,name,email,status,city,address,phone,date,product_ids]
            ];
            
            con.query(query,[values],(err,result)=>{
                res.redirect('/payment')
            });
        }
     });

});

app.get('/payment',function(req,res){
    res.render('pages/payment',{total:total})
});


 function discountprice(req,result){
    
    var total = req.session.total;
    var dis  = (result/100)*req.session.total;
    req.session.total = total-dis;
    return total-dis;
 }

app.post('/coupon',function(req,res){

    var coupon_code  = req.body.coupon_code;
      
    var con = mysql.createConnection({
        host:"localhost",
        user:"root",
        password:"",
        database:"astore"
    });
    
    var sql = 'SELECT discount_parcentage FROM coupon WHERE coupon_code = ?';
    con.query(sql, [coupon_code], function (err, result) {
    if (err) throw err;
         
    Object.keys(result).forEach(function(key) {
        var row = result[key];
        discountprice(req,row.discount_parcentage);
        res.redirect('/cart');
      });



    });
 
  


});





app.get('/search',(req,res) =>{

    var name  = req.body.name;

    var con = mysql.createConnection({
        host:"localhost",
        user:"root",
        password:"",
        database:"astore"
    });
     
     var sql = 'SELECT * FROM products WHERE name LIKE ?';
     con.query(sql,[name],(err,result)=>{

        res.render('pages/catagory',{result:result});
        

     });
      
});