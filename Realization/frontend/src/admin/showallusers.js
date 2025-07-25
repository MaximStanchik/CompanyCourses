import React, { useState, useEffect } from "react";
import NavBar from "../components/NavBar";
import axios from "../utils/axios";
import "./admin.css";
import Footer from "../components/Footer";
import i18n from "../i18n";

const divStyle = {
  display: "contents",
};

const Todo = (props) => {
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("jwtToken");
    if (token) {
      axios
        .get("/auth/currentUser", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        .then((response) => {
          setCurrentUser(response.data);
        })
        .catch(function (error) {
          console.log(error);
        });
    }
  }, []);

  const isOwner = currentUser && currentUser.id === props.todo.id;

  const viewHandle = props.todo.handle || props.todo.username || props.todo.name || props.todo.id;

  return (
    <div style={divStyle}>
      <tr>
        <td>{props.todo.name || props.todo.username || props.todo.firstName || '-'}</td>
        <td>{props.todo.email}</td>
        <td>{props.todo.role}</td>
        <td style={{padding:'4px 0'}}>
          <div style={{display:'flex',gap:8,justifyContent:'center'}}>
            <a
              href={`/profile/${viewHandle}`}
              className="btn btn-primary btn-info btn-sm"
              role="button"
              style={{marginTop:5}}
            >
              {i18n.t('common.view')||'View'}
            </a>
            {!isOwner && (
              <a
                href={`/allusers/edit/${props.todo.id}`}
                className="btn btn-primary btn-info btn-sm"
                role="button"
                aria-pressed="true"
                style={{marginTop:5}}
              >
                {i18n.t('common.edit') || 'Edit'}
              </a>
            )}
          </div>
        </td>
      </tr>
    </div>
  );
};

const UserList = () => {
  const [todos, setTodos] = useState([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  const t = i18n.t.bind(i18n);

  useEffect(() => {
    const token = localStorage.getItem("jwtToken");
    if (token) {
      axios
        .get("/auth/users/", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        .then((response) => {
          setTodos(response.data);
        })
        .catch((error) => {
          if (
            (error.response && error.response.status === 401) ||
            (error.response && error.response.status === 403)
          ) {
            window.location.href = "/login";
          } else {
            console.log(error);
          }
        });
    }
  }, []);

  const updateSearch = (event) => {
    setSearch(event.target.value.substr(0, 20));
  };

  const needle = search.toLowerCase();
  const filteredUsers = todos.filter(u=>{
    const haystack = [u.name,u.username,u.firstName,u.lastName,u.email,u.role]
      .map(x=> (x||'').toLowerCase())
      .join(' ');
    const matchesSearch = haystack.includes(needle);
    const matchesRole = roleFilter? (String(u.role).toLowerCase()===roleFilter): true;
    return matchesSearch && matchesRole;
  });

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <NavBar />
      <div style={{padding:20,display:'flex',flexDirection:'column',alignItems:'center',gap:20}}>
        <h1 style={{textAlign:'center',margin:0,fontSize:32,color:'#3976a8',fontWeight:700}}>
          {t('common.manage_users')}
        </h1>
        <div style={{display:'flex',gap:16,flexWrap:'wrap',justifyContent:'flex-start',width:'100%',maxWidth:'60%',margin:'0 auto'}}>
          <input
            type="text"
            placeholder={t('common.search') || 'Search...'}
            className="form-control"
            style={{ flex:1,minWidth:160,borderRadius:20,padding:'10px 16px',border:'1.5px solid #ccc',textAlign:'center' }}
            value={search}
            onChange={updateSearch}
          />
          <select value={roleFilter} onChange={e=>setRoleFilter(e.target.value)} style={{width:200,flexShrink:0,maxWidth:'90vw',borderRadius:20,padding:'10px 16px',border:'1.5px solid #ccc',background:'#fff',textAlign:'center',marginLeft:'auto'}}>
            <option value="">{t('common.all_roles')}</option>
            {[...new Set(todos.map(u=>u.role).filter(Boolean))].map(r=>(<option key={r} value={String(r).toLowerCase()}>{r}</option>))}
          </select>
        </div>
        <style>{`
          @media (max-width: 700px) {
            .admin-filter-row input.form-control { flex: 1 1 100% !important; margin-bottom: 10px; }
            .admin-filter-row select { width: 100% !important; margin-left: 0 !important; }
          }
        `}</style>
      </div>
      <div className="container admin-users-table-container" style={{ border: "6px solid lightgray", maxWidth: "60%", margin: "0 auto", borderRadius: 8, boxShadow: "0 4px 12px rgba(0,0,0,0.06)", overflowX:'auto' }}>
        <table
          className="table table-striped"
          data-order='[[ 1, "asc" ]]'
          data-page-length="25"
        >
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>{t('common.actions', 'Actions')}</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((currentTodo, i) => (
              <Todo todo={currentTodo} key={i} />
            ))}
          </tbody>
        </table>
      </div>
      <div style={{marginTop:'auto'}}><Footer /></div>
      {/* Responsive table container */}
      <style>{`
        @media (max-width: 700px) {
          .admin-users-table-container { max-width: 95vw !important; }
        }
      `}</style>
      <style>{`
        .admin-users-table-container td a{ text-decoration:none !important; outline:none !important; box-shadow:none !important; border:none !important; transition: background-color 0.25s ease, filter 0.25s ease, color 0.25s ease; }
        .admin-users-table-container td a:hover,
        .admin-users-table-container td a:focus,
        .admin-users-table-container td a:active,
        .admin-users-table-container td a.btn,
        .admin-users-table-container td a.btn:hover,
        .admin-users-table-container td a.btn:focus,
        .admin-users-table-container td a.btn:active{
          text-decoration:none !important;
          filter:brightness(1.12);
          transform:none !important;
          outline:none !important;
          box-shadow:none !important;
          border:none !important;
        }
        .admin-users-table-container td a::after, .admin-users-table-container td a::before { display:none !important; }

        .admin-users-table-container td a {
          text-decoration: none !important;
          border-bottom: none !important;
          outline: none !important;
          box-shadow: none !important;
          color: inherit !important;
        }
        
        .admin-users-table-container td a:hover,
        .admin-users-table-container td a:focus,
        .admin-users-table-container td a:active {
          text-decoration: none !important;
          border-bottom: none !important;
          outline: none !important;
          box-shadow: none !important;
          color: inherit !important;
        }
      `}</style>
    </div>
  );
};

export default UserList;
